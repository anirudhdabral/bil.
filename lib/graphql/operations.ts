import { gql } from "@apollo/client";

export const GET_HOMES = gql`
  query GetHomes {
    getHomes {
      id
      houseNo
      address
      owners
      members
      pendingInvites
      pendingDeletion
    }
  }
`;

export const GET_PENDING_HOME_INVITES = gql`
  query GetPendingHomeInvites {
    getPendingHomeInvites {
      id
      houseNo
      address
      owners
      members
      pendingInvites
      pendingDeletion
    }
  }
`;

export const GET_HOME_BY_ID = gql`
  query GetHomeById($id: ID!) {
    getHomeById(id: $id) {
      id
      houseNo
      address
      owners
      members
      pendingInvites
      pendingDeletion
    }
  }
`;

export const GET_DELETE_HOME_REQUESTS = gql`
  query GetDeleteHomeRequests {
    getDeleteHomeRequests {
      id
      houseNo
      address
      owners
      members
      pendingDeletion
      updatedAt
    }
  }
`;

export const REQUEST_DELETE_HOME = gql`
  mutation RequestDeleteHome($homeId: ID!) {
    requestDeleteHome(homeId: $homeId)
  }
`;

export const APPROVE_DELETE_HOME = gql`
  mutation ApproveDeleteHome($homeId: ID!) {
    approveDeleteHome(homeId: $homeId)
  }
`;

export const REJECT_DELETE_HOME = gql`
  mutation RejectDeleteHome($homeId: ID!) {
    rejectDeleteHome(homeId: $homeId)
  }
`;

export const GET_CATEGORIES_BY_HOME = gql`
  query GetCategoriesByHome($homeId: ID!) {
    getCategoriesByHome(homeId: $homeId) {
      id
      name
    }
  }
`;

export const GET_BILLS_BY_HOME = gql`
  query GetBillsByHome($homeId: ID!, $month: Int, $year: Int) {
    getBillsByHome(homeId: $homeId, month: $month, year: $year) {
      id
      date
      remarks
      imageUrl
      category {
        id
        name
      }
    }
  }
`;

export const GET_BILLS_BY_CATEGORY = gql`
  query GetBillsByCategory($categoryId: ID!, $month: Int, $year: Int) {
    getBillsByCategory(categoryId: $categoryId, month: $month, year: $year) {
      id
      date
      remarks
      imageUrl
      category {
        id
        name
      }
    }
  }
`;

export const CREATE_HOME = gql`
  mutation CreateHome($houseNo: String!, $address: String!) {
    createHome(houseNo: $houseNo, address: $address) {
      id
      houseNo
      address
      owners
      members
      pendingInvites
    }
  }
`;

export const INVITE_USER_TO_HOME = gql`
  mutation InviteUserToHome($homeId: ID!, $email: String!) {
    inviteUserToHome(homeId: $homeId, email: $email) {
      id
      owners
      members
      pendingInvites
    }
  }
`;

export const PROMOTE_HOME_MEMBER_TO_ADMIN = gql`
  mutation PromoteHomeMemberToAdmin($homeId: ID!, $email: String!) {
    promoteHomeMemberToAdmin(homeId: $homeId, email: $email) {
      id
      owners
      members
      pendingInvites
    }
  }
`;

export const REMOVE_MEMBER_FROM_HOME = gql`
  mutation RemoveMemberFromHome($homeId: ID!, $email: String!) {
    removeMemberFromHome(homeId: $homeId, email: $email) {
      id
      owners
      members
      pendingInvites
    }
  }
`;

export const CANCEL_HOME_INVITE = gql`
  mutation CancelHomeInvite($homeId: ID!, $email: String!) {
    cancelHomeInvite(homeId: $homeId, email: $email) {
      id
      owners
      members
      pendingInvites
    }
  }
`;

export const ACCEPT_HOME_INVITE = gql`
  mutation AcceptHomeInvite($homeId: ID!) {
    acceptHomeInvite(homeId: $homeId) {
      id
      members
      pendingInvites
    }
  }
`;

export const DECLINE_HOME_INVITE = gql`
  mutation DeclineHomeInvite($homeId: ID!) {
    declineHomeInvite(homeId: $homeId) {
      id
      pendingInvites
    }
  }
`;

export const UPDATE_HOME = gql`
  mutation UpdateHome($homeId: ID!, $houseNo: String!, $address: String!) {
    updateHome(homeId: $homeId, houseNo: $houseNo, address: $address) {
      id
      houseNo
      address
      owners
      members
      pendingInvites
    }
  }
`;
export const CREATE_CATEGORY = gql`
  mutation CreateCategory($name: String!, $homeId: ID!) {
    createCategory(name: $name, homeId: $homeId) {
      id
      name
    }
  }
`;

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($categoryId: ID!, $name: String!) {
    updateCategory(categoryId: $categoryId, name: $name) {
      id
      name
    }
  }
`;

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($categoryId: ID!) {
    deleteCategory(categoryId: $categoryId)
  }
`;

export const CREATE_BILL = gql`
  mutation CreateBill(
    $date: String!
    $remarks: String
    $categoryId: ID!
    $homeId: ID!
    $image: Upload
  ) {
    createBill(
      date: $date
      remarks: $remarks
      categoryId: $categoryId
      homeId: $homeId
      image: $image
    ) {
      id
      date
      remarks
      imageUrl
      category {
        id
        name
      }
    }
  }
`;

export const UPDATE_BILL = gql`
  mutation UpdateBill($billId: ID!, $date: String!, $remarks: String, $categoryId: ID!) {
    updateBill(billId: $billId, date: $date, remarks: $remarks, categoryId: $categoryId) {
      id
      date
      remarks
      imageUrl
      category {
        id
        name
      }
    }
  }
`;

export const DELETE_BILL = gql`
  mutation DeleteBill($billId: ID!) {
    deleteBill(billId: $billId)
  }
`;

