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
    }
  }
`;

export const GET_CATEGORIES_BY_HOME = gql`
  query GetCategoriesByHome($homeId: ID!) {
    getCategoriesByHome(homeId: $homeId) {
      id
      name
      home {
        id
      }
    }
  }
`;

export const GET_BILLS_BY_HOME = gql`
  query GetBillsByHome($homeId: ID!) {
    getBillsByHome(homeId: $homeId) {
      id
      date
      remarks
      imageUrl
      category {
        id
        name
      }
      home {
        id
      }
    }
  }
`;

export const GET_BILLS_BY_CATEGORY = gql`
  query GetBillsByCategory($categoryId: ID!) {
    getBillsByCategory(categoryId: $categoryId) {
      id
      date
      remarks
      imageUrl
      category {
        id
        name
      }
      home {
        id
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

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($name: String!, $homeId: ID!) {
    createCategory(name: $name, homeId: $homeId) {
      id
      name
      home {
        id
      }
    }
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
      home {
        id
      }
    }
  }
`;
