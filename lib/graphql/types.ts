export type Home = {
  id: string;
  houseNo: string;
  address: string;
  owners: string[];
  members: string[];
  pendingInvites: string[];
};

export type BillCategory = {
  id: string;
  name: string;
  home: Home;
};

export type Bill = {
  id: string;
  date: string;
  remarks?: string | null;
  imageUrl?: string | null;
  category: BillCategory;
  home: Home;
};
