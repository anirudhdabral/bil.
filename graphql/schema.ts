export const typeDefs = `#graphql
  scalar Upload

  type Home {
    id: ID!
    houseNo: String!
    address: String!
    owners: [String!]!
    members: [String!]!
    pendingInvites: [String!]!
    categories: [BillCategory!]!
    bills: [Bill!]!
    createdAt: String
    updatedAt: String
  }

  type BillCategory {
    id: ID!
    name: String!
    home: Home!
    bills: [Bill!]!
    createdAt: String
    updatedAt: String
  }

  type Bill {
    id: ID!
    date: String!
    remarks: String
    imageUrl: String
    category: BillCategory!
    home: Home!
    createdAt: String
    updatedAt: String
  }

  type Query {
    getHomes: [Home!]!
    getPendingHomeInvites: [Home!]!
    getHomeById(id: ID!): Home
    getCategoriesByHome(homeId: ID!): [BillCategory!]!
    getBillsByHome(homeId: ID!, month: Int, year: Int): [Bill!]!
    getBillsByCategory(categoryId: ID!, month: Int, year: Int): [Bill!]!
  }

  type Mutation {
    createHome(houseNo: String!, address: String!): Home!
    updateHome(homeId: ID!, houseNo: String!, address: String!): Home!
    createCategory(name: String!, homeId: ID!): BillCategory!
    updateCategory(categoryId: ID!, name: String!): BillCategory!
    deleteCategory(categoryId: ID!): Boolean!
    inviteUserToHome(homeId: ID!, email: String!): Home!
    promoteHomeMemberToAdmin(homeId: ID!, email: String!): Home!
    removeMemberFromHome(homeId: ID!, email: String!): Home!
    cancelHomeInvite(homeId: ID!, email: String!): Home!
    acceptHomeInvite(homeId: ID!): Home!
    declineHomeInvite(homeId: ID!): Home!
    createBill(
      date: String!
      remarks: String
      categoryId: ID!
      homeId: ID!
      image: Upload
    ): Bill!
    updateBill(
      billId: ID!
      date: String!
      remarks: String
      categoryId: ID!
    ): Bill!
    deleteBill(billId: ID!): Boolean!
  }
`;
