import { Db, ObjectId } from "mongodb";
import uniqeBy from 'lodash/uniqBy';
import { MemberTier } from "./resolvers-types";

interface MongoEvent extends Omit<Event, 'id' | 'org'> {
  migrationId: number
}

export const unassignmentCSV = async (prodDb: Db) => {
  try {
    const ignoreIds = [
      '6589b8fc9ac5b20bc457bb4f',
      '6589eb3f3a972db63af7ca5c',
      '6589eb4d91a91d4eb22dbe9a',
      '6589ff7418932ef8d1b7ad88',
      '658a158573d1475b33e96c1e',
      '658a4cc112b0664e4a2be9e5',
      '658a6bfdaac69f8d693e27ef',
      '658a6d383540b264c72d0140',
      '658a979e0912fd9539db88f0',
      '658ae61b4e546e2083024c84',
      '658ae8ab7cf9d54e070a9ed8',
      '658af05c7cf9d54e070a9eda',
      '658afa30620738a86da9d4c3',
      '658afae9f8008e58a750278a',
    ];

    const users: any = [];
    for await (const shift of await prodDb.collection('shifts').aggregate([
      {
        $match: {
          _id: {$nin: ignoreIds.map(id => new ObjectId(id))},
          removedAt: {$gte: 1703503590793},
          status: 'RELINQUISHED',
        },
      },
      {
        $addFields: {
          userId: {
            $toObjectId: "$userId",
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
    ])) {
      const {
        user: foundUser,
        ...shiftData
      } = shift;
      const user = foundUser?.[0];

      if (user.member.tier === MemberTier.Tier_2) {
        users.push({
          ...user,
          id: user._id.toString(),
        });
      }
    }

    const uniqUsers = uniqeBy(users, 'id');

    console.log(uniqUsers.map((user: any) => `${user.name}, ${user.member.pNumber}`).join('\n'));

    // const shifts = [
    //   {
    //     "userId": "65810eb96b4100cdebc8ae6e",
    //     "id": "6583786c39bd7025414bcfdf"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ae6e",
    //     "id": "65837b1e39bd7025414bcfeb"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ae6e",
    //     "id": "658373adec939b7c8d5ad182"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8aec9",
    //     "id": "658379ae75f7c9e998ffbb27"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8aec9",
    //     "id": "65837a2694fe4e6184f1997d"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8aec9",
    //     "id": "65837bf439bd7025414bcff2"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8aec9",
    //     "id": "658371b1ec939b7c8d5ad179"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8aec9",
    //     "id": "65837272ec939b7c8d5ad17d"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8aec9",
    //     "id": "658375302db4bca6053c574c"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8aec9",
    //     "id": "6581f79887e3dd3bca450bc8"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b0b7",
    //     "id": "65837b4539bd7025414bcfed"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b0b7",
    //     "id": "658373e72db4bca6053c5746"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b475",
    //     "id": "65837b4894fe4e6184f19981"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b475",
    //     "id": "658373ed2db4bca6053c5747"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b475",
    //     "id": "6583753594fe4e6184f19971"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b475",
    //     "id": "658362b8d45087f0d34a9876"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b475",
    //     "id": "65836465ec939b7c8d5ad165"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ae82",
    //     "id": "658379af75f7c9e998ffbb28"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ae82",
    //     "id": "65837a2894fe4e6184f1997e"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ae82",
    //     "id": "65837bf539bd7025414bcff3"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ae82",
    //     "id": "65836eb7ec939b7c8d5ad170"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ae82",
    //     "id": "658372782db4bca6053c5740"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ae82",
    //     "id": "658373eeec939b7c8d5ad184"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ae82",
    //     "id": "6581d782c5413cf08463c6ca"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b065",
    //     "id": "65837a2b39bd7025414bcfe5"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b065",
    //     "id": "65837ae839bd7025414bcfea"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b065",
    //     "id": "65837b4a94fe4e6184f19982"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b065",
    //     "id": "65837bf794fe4e6184f19987"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ad40",
    //     "id": "658377fc39bd7025414bcfdd"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ad40",
    //     "id": "658379b075f7c9e998ffbb29"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ad40",
    //     "id": "65837bf994fe4e6184f19988"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ad40",
    //     "id": "65836ebdec939b7c8d5ad171"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ad40",
    //     "id": "658373efec939b7c8d5ad185"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ad40",
    //     "id": "658375382db4bca6053c574d"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ad40",
    //     "id": "6581c672d290587ac84edc96"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ad40",
    //     "id": "6581c527f33f0433d9e75156"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8af12",
    //     "id": "65837b7c39bd7025414bcfee"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8af12",
    //     "id": "65837bfa75f7c9e998ffbb32"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8af12",
    //     "id": "6583617fec939b7c8d5ad154"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8af12",
    //     "id": "658362bbec939b7c8d5ad160"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8af12",
    //     "id": "6583646bec939b7c8d5ad166"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ae6d",
    //     "id": "658377fd39bd7025414bcfde"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ae6d",
    //     "id": "65837b4d94fe4e6184f19984"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ae6d",
    //     "id": "6581d79b1eda54783cb46f9e"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ae6d",
    //     "id": "6581d774c5413cf08463c6c9"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b002",
    //     "id": "65837b7d39bd7025414bcfef"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b002",
    //     "id": "6583743a2db4bca6053c5749"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b002",
    //     "id": "658362f0dae3f61ad1e01a94"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b002",
    //     "id": "65832557390146fd09934500"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b002",
    //     "id": "6581be54790d75bbe45f30a5"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b002",
    //     "id": "6581ba7ba9b0aa878e18460d"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ac54",
    //     "id": "658379ee39bd7025414bcfe3"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ac54",
    //     "id": "65837bbb39bd7025414bcff1"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ac54",
    //     "id": "658374faec939b7c8d5ad189"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8adb0",
    //     "id": "65837a2339bd7025414bcfe4"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8adb0",
    //     "id": "6583752e94fe4e6184f1996f"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8adb0",
    //     "id": "65835f0cdae3f61ad1e01a7d"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8adb0",
    //     "id": "65836174dae3f61ad1e01a8b"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8adb0",
    //     "id": "65836463dae3f61ad1e01a9b"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8aefe",
    //     "id": "65837c3694fe4e6184f19989"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b4a7",
    //     "id": "658371042db4bca6053c573d"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b4a7",
    //     "id": "658371b594fe4e6184f19960"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b4a7",
    //     "id": "65837275ec939b7c8d5ad17e"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b4a7",
    //     "id": "6583753294fe4e6184f19970"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b377",
    //     "id": "658373ea94fe4e6184f19969"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b377",
    //     "id": "6581c6a01f86050ff0e46d4d"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b3ed",
    //     "id": "65836fe0ec939b7c8d5ad176"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b3ed",
    //     "id": "658373ecec939b7c8d5ad183"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b3ed",
    //     "id": "658374c794fe4e6184f1996d"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b3ed",
    //     "id": "65835cae43a84dd1114f4a00"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b3ed",
    //     "id": "658362bcec939b7c8d5ad161"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ad36",
    //     "id": "658374a8ec939b7c8d5ad187"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b14a",
    //     "id": "658371f7ec939b7c8d5ad17a"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b14a",
    //     "id": "658372fa94fe4e6184f19966"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b14a",
    //     "id": "658375e694fe4e6184f19974"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b3ff",
    //     "id": "658372b42db4bca6053c5741"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b407",
    //     "id": "658372b1ec939b7c8d5ad181"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b407",
    //     "id": "658375712db4bca6053c574f"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b407",
    //     "id": "658361c7dae3f61ad1e01a91"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b407",
    //     "id": "658364d2d45087f0d34a987d"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b4a5",
    //     "id": "658374a6ec939b7c8d5ad186"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b4a5",
    //     "id": "65836461ec939b7c8d5ad164"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b4a5",
    //     "id": "658364d4dae3f61ad1e01aa0"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b056",
    //     "id": "658373042db4bca6053c5742"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b056",
    //     "id": "6583733b94fe4e6184f19968"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b056",
    //     "id": "658375e794fe4e6184f19975"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b542",
    //     "id": "6583733d2db4bca6053c5743"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b492",
    //     "id": "658375782db4bca6053c5750"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b492",
    //     "id": "658363d9dae3f61ad1e01a99"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b2fd",
    //     "id": "65835f0ad45087f0d34a9872"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b471",
    //     "id": "6583617bdae3f61ad1e01a8d"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b471",
    //     "id": "658362b6ec939b7c8d5ad15e"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b543",
    //     "id": "65835cb2989e0dfd5c985e42"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b543",
    //     "id": "65835de0f950b5b2f8e099da"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b543",
    //     "id": "658362beec939b7c8d5ad162"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b543",
    //     "id": "6583218036ff96f5de42438f"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b543",
    //     "id": "6583228c080d649429df7773"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b543",
    //     "id": "6583255a080d649429df777d"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b543",
    //     "id": "6581c39f69d0b9a4f4f0c3fc"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b543",
    //     "id": "6581d72ac5413cf08463c6c8"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b54a",
    //     "id": "658362f2dae3f61ad1e01a95"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b54a",
    //     "id": "65832558080d649429df777c"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b54a",
    //     "id": "6581c9fe0ebce50f232c59de"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b0df",
    //     "id": "65835ec5d45087f0d34a9871"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b0df",
    //     "id": "65836281d45087f0d34a9875"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b0df",
    //     "id": "65836419d45087f0d34a987b"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b3a3",
    //     "id": "65835fa6dae3f61ad1e01a82"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b3a3",
    //     "id": "65836395d45087f0d34a9878"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b193",
    //     "id": "6583623eec939b7c8d5ad15a"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b3b3",
    //     "id": "65836206ec939b7c8d5ad158"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8aede",
    //     "id": "6583250b080d649429df777a"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b4ec",
    //     "id": "6583272d390146fd09934504"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8adb7",
    //     "id": "6583224036ff96f5de424392"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8adb7",
    //     "id": "65832738080d649429df7781"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8adb7",
    //     "id": "6583277f080d649429df7786"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b2fe",
    //     "id": "6583210d080d649429df7770"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b2fe",
    //     "id": "6583261336ff96f5de424397"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b3a5",
    //     "id": "65832740080d649429df7782"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8afc0",
    //     "id": "65832742080d649429df7783"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8af09",
    //     "id": "65832550080d649429df777b"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8af09",
    //     "id": "65832744390146fd09934505"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8af40",
    //     "id": "6583255b080d649429df777e"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b488",
    //     "id": "65832615390146fd09934502"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b198",
    //     "id": "65832687390146fd09934503"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b2b7",
    //     "id": "65832370390146fd099344fb"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8af4d",
    //     "id": "6581ef2f87e3dd3bca450bac"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b2ed",
    //     "id": "6581f79487e3dd3bca450bc7"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b27e",
    //     "id": "6581f84dac076b3cd15119b5"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b2c5",
    //     "id": "6581bf45790d75bbe45f30b0"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b009",
    //     "id": "6581f5a1ac8365f616a8d0b9"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b2c7",
    //     "id": "6581f5a4ac8365f616a8d0ba"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8af48",
    //     "id": "6581f7e4ac8365f616a8d0d1"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ad6e",
    //     "id": "6581f914ac8365f616a8d0d5"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b2c0",
    //     "id": "6581c035e124cc1a78934ae2"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b08d",
    //     "id": "6581c01da9b0aa878e18462d"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b08d",
    //     "id": "6581c0673f18491980af9ca5"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ada6",
    //     "id": "6581c5ecf33f0433d9e7515b"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ad31",
    //     "id": "6581c98bd290587ac84edcae"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ad8e",
    //     "id": "6581ca1f0ebce50f232c59e0"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ad8e",
    //     "id": "6581ca600ebce50f232c59e6"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b3ec",
    //     "id": "6581c63680341b14db4fc31f"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b3ec",
    //     "id": "6581c71169d0b9a4f4f0c405"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ae8f",
    //     "id": "6581c99a69d0b9a4f4f0c412"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ac92",
    //     "id": "6581be52a9b0aa878e184625"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ac92",
    //     "id": "6581c303a9b0aa878e184641"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ac92",
    //     "id": "6581ba6b01cb5cbfd35637b2"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ac92",
    //     "id": "6581c3dad290587ac84edc81"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ac92",
    //     "id": "6581d77380341b14db4fc342"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8af0d",
    //     "id": "6581d73f80341b14db4fc341"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8af0d",
    //     "id": "6581be53790d75bbe45f30a4"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8af0d",
    //     "id": "6581be6ae124cc1a78934ad2"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b4fc",
    //     "id": "6581bf50e124cc1a78934ad8"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b4fc",
    //     "id": "6581c3c1d290587ac84edc80"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b074",
    //     "id": "6581bf52a9b0aa878e18462b"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b074",
    //     "id": "6581c3c380341b14db4fc30c"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8add7",
    //     "id": "6581b9b801cb5cbfd35637af"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8add7",
    //     "id": "6581ba15a9b0aa878e18460a"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b3ce",
    //     "id": "6581c319a9b0aa878e184642"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ae10",
    //     "id": "6581c36fe124cc1a78934aef"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ae10",
    //     "id": "6581c41ff33f0433d9e7514e"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8b1c3",
    //     "id": "6581c43af33f0433d9e7514f"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8aea9",
    //     "id": "6581bc77a9b0aa878e184615"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8ac90",
    //     "id": "6581bdea26f84b895c409e4b"
    //   },
    //   {
    //     "userId": "65810eb96b4100cdebc8af0e",
    //     "id": "6581c0e6a9b0aa878e184631"
    //   }
    // ];

    // const shiftIds = shifts.map(shift => new ObjectId(shift.id));

    // for await (const shift of await prodDb.collection('shifts').aggregate([
    //   {
    //     $match: {
    //       _id: {
    //         $in: shiftIds
    //       }
    //     }
    //   },
    //   {
    //     $addFields: {
    //       eventId: {
    //         $toObjectId: "$eventId",
    //       },
    //       assignmentId: {
    //         $toObjectId: "$assignmentId",
    //       },
    //       userId: {
    //         $toObjectId: "$userId",
    //       },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "events",
    //       localField: "eventId",
    //       foreignField: "_id",
    //       as: "event",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "assignments",
    //       localField: "assignmentId",
    //       foreignField: "_id",
    //       as: "assignment",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "users",
    //       localField: "userId",
    //       foreignField: "_id",
    //       as: "user",
    //     },
    //   },
    // ])) {
    //   const {
    //     event: foundEvent,
    //     assignment: foundAssignment,
    //     user: foundUser,
    //     ...shiftData
    //   } = shift;
    //   const user = foundUser?.[0];
    //   const event = foundEvent?.[0];
    //   const assignment = foundAssignment?.[0];


    //   console.log(`${event.referenceId}, ${event.name}, ${assignment.name}, ${shiftData.refNumber}, ${user.name}, UNASSIGNED`);
    // }
    
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}