import { utcToZonedTime } from "date-fns-tz";
import { IEvent } from "../models/event";
import { IOrganization } from "../models/organizations/organization.entity";
import { IRank } from "../models/rank";
import { IShift } from "../models/shift";
import { IUser } from "../types/common";
import { add, addDays, differenceInHours, format } from "date-fns";

const top = ({
  eventName,
  todaysDate,
  dueDate,
} : {
  eventName: string;
  todaysDate: string;
  dueDate: string;
}) => `<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8" />
		<title>Invoice Template</title>

		<style>
			.invoice-box {
				max-width: 800px;
				margin: auto;
				padding: 30px;
				font-size: 16px;
				line-height: 24px;
				font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
				color: #555;
			}

			.invoice-box table {
				width: 100%;
				line-height: inherit;
				text-align: left;
			}

			.invoice-box table td {
				padding: 5px;
				vertical-align: top;
			}

			.invoice-box table tr.header td:last-child {
				text-align: right;
			}

			.invoice-box table tr td:last-child {
				text-align: right;
			}

			.invoice-box table tr.top table td {
				padding-bottom: 20px;
			}

			.invoice-box table tr.top table td.title {
				font-size: 45px;
				line-height: 45px;
				color: #333;
			}

			.invoice-box table tr.information table td {
				padding-bottom: 40px;
			}

			.invoice-box table tr.heading td {
				background: #eee;
				border-bottom: 1px solid #ddd;
				font-weight: bold;
			}

			.invoice-box table tr.details td {
				padding-bottom: 20px;
			}

			.invoice-box table tr.item td {
				border-bottom: 1px solid #eee;
			}

			.invoice-box table tr.item.last td {
				border-bottom: none;
			}

			.invoice-box table tr.total td:last-child {
				border-top: 2px solid #eee;
				font-weight: bold;
			}

			@media only screen and (max-width: 600px) {
				.invoice-box table tr.top table td {
					width: 100%;
					display: block;
					text-align: center;
				}

				.invoice-box table tr.information table td {
					width: 100%;
					display: block;
					text-align: center;
				}
			}

			/** RTL **/
			.invoice-box.rtl {
				direction: rtl;
				font-family: Tahoma, 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
			}

			.invoice-box.rtl table {
				text-align: right;
			}

			.invoice-box.rtl table tr td:nth-child(2) {
				text-align: left;
			}

			.tab {
				color: white;
			}
		</style>
	</head>

	<body>
		<div class="invoice-box">
			<table cellpadding="0" cellspacing="0">
				<tr class="top">
					<td colspan="5">
						<table>
							<tr>
								<td class="title">
									<img
										src="https://caleo-dev-public-docs.s3.us-west-2.amazonaws.com/stpete.png"
										style="width: 100%; max-width: 300px"
									/>
								</td>

								<td>
									Invoice #: 123<br />
                  Event: ${eventName}<br />
									Created: ${todaysDate}<br />
									Due: ${dueDate}
								</td>
							</tr>
						</table>
					</td>
				</tr>

				<tr class="information">
					<td colspan="5">
						<table>
							<tr>
								<td>
									St. Petersburg Police Department.<br />
									1301 1st Ave N<br />
									St. Petersburg, FL 33705
								</td>

								<td>
									Acme Corp.<br />
									John Doe<br />
									john@example.com
								</td>
							</tr>
						</table>
					</td>
				</tr>

				<tr class="heading">
					<td>Name</td>
					<td>P Number</td>
					<td>Rate</td>
					<td>Duration (hours)</td>
					<td>Total</td>
				</tr>`;

const item = ({
  name,
  pNumber,
  rate,
  duration,
  isLast,
}: {
  name: string;
  pNumber: string;
  rate: number;
  duration: number;
  isLast?: boolean;
}) => {
  return `<tr class="item ${isLast ? 'last' : ''}">
    <td>${name}</td>
    <td>${pNumber}</td>
    <td>${rate.toLocaleString('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
		})}</td>
    <td>${duration}</td>
    <td>${(rate * duration).toLocaleString('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
		})}</td>
  </tr>`;
}

const bottom = (total: number) => {
	const formattedTotal = total.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
	});
  return `<tr class="total">
					<td></td>
					<td></td>
					<td></td>
					<td></td>

					<td>Total: ${formattedTotal}</td>
				</tr>
			</table>

			<p class="tab">###SIGN_HERE###</p>
      <p class="tab">###ORG_ID###</p>
      <p class="tab">###EVENT_ID###</p>
		</div>
	</body>
</html>`;
}

export class InvoiceService {
  constructor() {}

  createInvoice({
    event,
    organization,
    ranks,
    users,
    shifts,
  }: {
    event: IEvent;
    organization: IOrganization;
    ranks: IRank[];
    users: IUser[];
    shifts: IShift[];
  }) {
    const ranksMap = ranks.reduce((acc, rank) => {
      acc[rank._id!.toString()] = rank;
      return acc;
    }, {} as Record<string, IRank>);
    const usersMap = users.reduce((acc, user) => {
      acc[user._id!.toString()] = user;
      return acc;
    }, {} as Record<string, IUser>);

    const invoiceItems = shifts.map((shift, index) => {
      const user = usersMap[shift.userId!.toString()];
      if (!user) {
        return {
          html: '',
          total: 0
        };
      }
      const rank = ranksMap[user.member.rankId!.toString()];
      if (!rank) {
        return {
          html: '',
          total: 0
        };
      }

      const rate = rank.hourlyRate || 0;
      const duration = differenceInHours(
        utcToZonedTime(shift.endTime, organization.timezone),
        utcToZonedTime(shift.startTime, organization.timezone)
      );

      return {
        html: item({
          name: `${user.firstName} ${user.lastName}`,
          pNumber: user.member.pNumber,
          rate,
          duration,
          isLast: index === shifts.length - 1,
        }),
        total: rate * duration,
      };
    });
    const total = invoiceItems.reduce((acc, item) => acc + item.total, 0);

    const today = utcToZonedTime(new Date(), organization.timezone);
    let html = top({
      eventName: event.name,
      todaysDate: format(today, 'MMM do yyyy'),
      dueDate: format(addDays(today, 30), 'MMM do yyyy'),
    });
    html += invoiceItems.map(({html}) => html).join('');
    html += bottom(total);

    return html;
  }
}