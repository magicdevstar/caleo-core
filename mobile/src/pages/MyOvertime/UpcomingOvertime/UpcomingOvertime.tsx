import './UpcomingOvertime.css';
import EmptyView from '../../../components/EmptyView/EmptyView';
import { useQuery } from '@apollo/client';
import { useAuthContext } from '../../../auth/hooks/use-auth-context';
import { GET_ALL_SHIFTS } from '../../../api/shifts';

const UpcomingOvertime: React.FC<any> = () => {
  const { user } = useAuthContext();
  const { data, loading } = useQuery(GET_ALL_SHIFTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        orderBy: 'startTime',
        order: 'asc',
        userId: user?.id,
        startTime: new Date().toISOString(),
      },
    }
  });

  console.log(data);
  return (
    <div>
      Upcoming Overtime
    </div>
  );
};

export default UpcomingOvertime;
