import { GraphQLError, GraphQLScalarType, Kind } from "graphql";
import { Types } from "mongoose";

import { processAndSaveBillImage } from "../lib/imageUpload";
import Bill from "../models/Bill";
import BillCategory from "../models/BillCategory";
import Home from "../models/Home";

type GraphQLContext = {
  currentUserEmail: string | null;
};

type HomeAccessShape = {
  owners?: string[];
  ownerEmail?: string | null;
  members?: string[];
  pendingInvites?: string[];
};

type UploadLike = {
  name?: string;
  type?: string;
  size?: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

function assertObjectId(value: string, fieldName: string): void {
  if (!Types.ObjectId.isValid(value)) {
    throw new GraphQLError(`${fieldName} must be a valid ObjectId`, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
}

function requireUserEmail(context: GraphQLContext): string {
  const email = context.currentUserEmail?.trim().toLowerCase();
  if (!email) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return email;
}

function normalizeEmails(list: string[] | undefined | null): string[] {
  return (list ?? [])
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

function getHomeOwners(home: HomeAccessShape): string[] {
  const owners = normalizeEmails(home.owners);
  if (owners.length > 0) {
    return owners;
  }

  const legacyOwner = home.ownerEmail?.trim().toLowerCase();
  return legacyOwner ? [legacyOwner] : [];
}

function getPendingInvites(home: HomeAccessShape): string[] {
  return normalizeEmails(home.pendingInvites);
}

function ensureUserCanAccessHome(home: HomeAccessShape, userEmail: string): void {
  const owners = getHomeOwners(home);
  const members = normalizeEmails(home.members);
  if (owners.includes(userEmail) || members.includes(userEmail)) {
    return;
  }

  throw new GraphQLError("Access denied for this home", {
    extensions: { code: "FORBIDDEN" },
  });
}

function isUploadLike(value: unknown): value is UploadLike {
  if (!value || typeof value !== "object") {
    return false;
  }

  return typeof (value as UploadLike).arrayBuffer === "function";
}

function validateEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    throw new GraphQLError("Invalid email address", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  return normalized;
}

function parseIsoDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new GraphQLError("date must be a valid ISO date string", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  return date;
}

async function requireAccessibleBillWithHome(billId: string, userEmail: string) {
  assertObjectId(billId, "billId");

  const bill = await Bill.findById(billId);
  if (!bill) {
    throw new GraphQLError("Bill not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const home = await Home.findById(bill.home);
  if (!home) {
    throw new GraphQLError("Home not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  ensureUserCanAccessHome(home, userEmail);

  return { bill, home };
}

async function requireAccessibleCategoryWithHome(categoryId: string, userEmail: string) {
  assertObjectId(categoryId, "categoryId");

  const category = await BillCategory.findById(categoryId);
  if (!category) {
    throw new GraphQLError("Category not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const home = await Home.findById(category.home);
  if (!home) {
    throw new GraphQLError("Home not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  ensureUserCanAccessHome(home, userEmail);

  return { category, home };
}

function throwInternalError(error: unknown): never {
  if (error instanceof GraphQLError) {
    throw error;
  }

  if (error instanceof Error && error.name === "ValidationError") {
    throw new GraphQLError(error.message, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  throw new GraphQLError("Unexpected server error", {
    extensions: { code: "INTERNAL_SERVER_ERROR" },
  });
}

const uploadScalar = new GraphQLScalarType({
  name: "Upload",
  description: "Upload scalar for GraphQL multipart requests",
  parseValue(value: unknown) {
    return value;
  },
  serialize() {
    return null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.NULL) {
      return null;
    }

    throw new GraphQLError("Upload must be provided as a variable", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  },
});

export const resolvers = {
  Upload: uploadScalar,

  Query: {
    getHomes: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);

        return await Home.find({
          $or: [{ owners: userEmail }, { ownerEmail: userEmail }, { members: userEmail }],
        }).sort({ createdAt: -1 });
      } catch (error) {
        throwInternalError(error);
      }
    },

    getPendingHomeInvites: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);
        return await Home.find({ pendingInvites: userEmail }).sort({ createdAt: -1 });
      } catch (error) {
        throwInternalError(error);
      }
    },

    getHomeById: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);
        assertObjectId(args.id, "id");

        const home = await Home.findById(args.id);
        if (!home) {
          return null;
        }

        ensureUserCanAccessHome(home, userEmail);
        return home;
      } catch (error) {
        throwInternalError(error);
      }
    },

    getCategoriesByHome: async (_parent: unknown, args: { homeId: string }, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);
        assertObjectId(args.homeId, "homeId");

        const home = await Home.findById(args.homeId);
        if (!home) {
          throw new GraphQLError("Home not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        ensureUserCanAccessHome(home, userEmail);
        return await BillCategory.find({ home: args.homeId }).sort({ createdAt: -1 });
      } catch (error) {
        throwInternalError(error);
      }
    },

    getBillsByHome: async (_parent: unknown, args: { homeId: string }, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);
        assertObjectId(args.homeId, "homeId");

        const home = await Home.findById(args.homeId);
        if (!home) {
          throw new GraphQLError("Home not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        ensureUserCanAccessHome(home, userEmail);
        return await Bill.find({ home: args.homeId }).populate("category").sort({ date: -1, createdAt: -1 });
      } catch (error) {
        throwInternalError(error);
      }
    },

    getBillsByCategory: async (_parent: unknown, args: { categoryId: string }, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);
        assertObjectId(args.categoryId, "categoryId");

        const category = await BillCategory.findById(args.categoryId);
        if (!category) {
          return [];
        }

        const home = await Home.findById(category.home);
        if (!home) {
          throw new GraphQLError("Home not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        ensureUserCanAccessHome(home, userEmail);
        return await Bill.find({ category: args.categoryId }).populate("category").sort({ date: -1, createdAt: -1 });
      } catch (error) {
        throwInternalError(error);
      }
    },
  },

  Mutation: {
    createHome: async (_parent: unknown, args: { houseNo: string; address: string }, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);
        const houseNo = args.houseNo?.trim();
        const address = args.address?.trim();

        if (!houseNo || !address) {
          throw new GraphQLError("houseNo and address are required", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        return await Home.create({
          houseNo,
          address,
          owners: [userEmail],
          members: [userEmail],
          pendingInvites: [],
        });
      } catch (error) {
        throwInternalError(error);
      }
    },

    inviteUserToHome: async (_parent: unknown, args: { homeId: string; email: string }, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);
        assertObjectId(args.homeId, "homeId");
        const inviteeEmail = validateEmail(args.email);

        const home = await Home.findById(args.homeId);
        if (!home) {
          throw new GraphQLError("Home not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        const owners = getHomeOwners(home);
        if (!owners.includes(userEmail)) {
          throw new GraphQLError("Only home owner can invite users", {
            extensions: { code: "FORBIDDEN" },
          });
        }

        const members = normalizeEmails(home.members);
        const pendingInvites = getPendingInvites(home);
        if (owners.includes(inviteeEmail) || members.includes(inviteeEmail)) {
          return home;
        }

        if (!pendingInvites.includes(inviteeEmail)) {
          home.pendingInvites = [...pendingInvites, inviteeEmail];
          await home.save();
        }

        return home;
      } catch (error) {
        throwInternalError(error);
      }
    },

    promoteHomeMemberToAdmin: async (_parent: unknown, args: { homeId: string; email: string }, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);
        assertObjectId(args.homeId, "homeId");
        const promoteEmail = validateEmail(args.email);

        const home = await Home.findById(args.homeId);
        if (!home) {
          throw new GraphQLError("Home not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        const owners = getHomeOwners(home);
        if (!owners.includes(userEmail)) {
          throw new GraphQLError("Only home admin can promote members", {
            extensions: { code: "FORBIDDEN" },
          });
        }

        const members = normalizeEmails(home.members);
        if (!members.includes(promoteEmail)) {
          throw new GraphQLError("User must be a home member before becoming admin", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        if (!owners.includes(promoteEmail)) {
          home.owners = [...owners, promoteEmail];
          await home.save();
        }

        return home;
      } catch (error) {
        throwInternalError(error);
      }
    },

    removeMemberFromHome: async (_parent: unknown, args: { homeId: string; email: string }, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);
        assertObjectId(args.homeId, "homeId");
        const targetEmail = validateEmail(args.email);

        const home = await Home.findById(args.homeId);
        if (!home) {
          throw new GraphQLError("Home not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        const owners = getHomeOwners(home);
        if (!owners.includes(userEmail)) {
          throw new GraphQLError("Only home owner can remove members", {
            extensions: { code: "FORBIDDEN" },
          });
        }

        if (owners.includes(targetEmail)) {
          throw new GraphQLError("Cannot remove an admin from the home", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        const members = normalizeEmails(home.members);
        home.members = members.filter((email) => email !== targetEmail);
        await home.save();
        return home;
      } catch (error) {
        throwInternalError(error);
      }
    },

    cancelHomeInvite: async (_parent: unknown, args: { homeId: string; email: string }, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);
        assertObjectId(args.homeId, "homeId");
        const targetEmail = validateEmail(args.email);

        const home = await Home.findById(args.homeId);
        if (!home) {
          throw new GraphQLError("Home not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        const owners = getHomeOwners(home);
        if (!owners.includes(userEmail)) {
          throw new GraphQLError("Only home owner can cancel invites", {
            extensions: { code: "FORBIDDEN" },
          });
        }

        const pendingInvites = getPendingInvites(home);
        home.pendingInvites = pendingInvites.filter((email) => email !== targetEmail);
        await home.save();
        return home;
      } catch (error) {
        throwInternalError(error);
      }
    },

    acceptHomeInvite: async (_parent: unknown, args: { homeId: string }, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);
        assertObjectId(args.homeId, "homeId");

        const home = await Home.findById(args.homeId);
        if (!home) {
          throw new GraphQLError("Home not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        const pendingInvites = getPendingInvites(home);
        if (!pendingInvites.includes(userEmail)) {
          throw new GraphQLError("No pending invite found for current user", {
            extensions: { code: "FORBIDDEN" },
          });
        }

        home.pendingInvites = pendingInvites.filter((email) => email !== userEmail);

        const members = normalizeEmails(home.members);
        if (!members.includes(userEmail)) {
          home.members = [...members, userEmail];
        }

        await home.save();
        return home;
      } catch (error) {
        throwInternalError(error);
      }
    },

    declineHomeInvite: async (_parent: unknown, args: { homeId: string }, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);
        assertObjectId(args.homeId, "homeId");

        const home = await Home.findById(args.homeId);
        if (!home) {
          throw new GraphQLError("Home not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        const pendingInvites = getPendingInvites(home);
        home.pendingInvites = pendingInvites.filter((email) => email !== userEmail);
        await home.save();
        return home;
      } catch (error) {
        throwInternalError(error);
      }
    },

    createCategory: async (_parent: unknown, args: { name: string; homeId: string }, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);
        const name = args.name?.trim();
        if (!name) {
          throw new GraphQLError("name is required", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        assertObjectId(args.homeId, "homeId");

        const home = await Home.findById(args.homeId);
        if (!home) {
          throw new GraphQLError("Home not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        ensureUserCanAccessHome(home, userEmail);
        return await BillCategory.create({ name, home: args.homeId });
      } catch (error) {
        throwInternalError(error);
      }
    },

    updateCategory: async (_parent: unknown, args: { categoryId: string; name: string }, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);
        const { category } = await requireAccessibleCategoryWithHome(args.categoryId, userEmail);
        const name = args.name?.trim();

        if (!name) {
          throw new GraphQLError("name is required", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        category.name = name;
        await category.save();
        return category;
      } catch (error) {
        throwInternalError(error);
      }
    },

    deleteCategory: async (_parent: unknown, args: { categoryId: string }, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);
        const { category } = await requireAccessibleCategoryWithHome(args.categoryId, userEmail);
        const billsCount = await Bill.countDocuments({ category: category._id });

        if (billsCount > 0) {
          throw new GraphQLError("Cannot delete a category that still has bills.", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        await category.deleteOne();
        return true;
      } catch (error) {
        throwInternalError(error);
      }
    },

    createBill: async (
      _parent: unknown,
      args: { date: string; remarks?: string; categoryId: string; homeId: string; image?: unknown },
      context: GraphQLContext
    ) => {
      try {
        const userEmail = requireUserEmail(context);
        assertObjectId(args.categoryId, "categoryId");
        assertObjectId(args.homeId, "homeId");

        const date = parseIsoDate(args.date);

        const [category, home] = await Promise.all([
          BillCategory.findById(args.categoryId),
          Home.findById(args.homeId),
        ]);

        if (!category) {
          throw new GraphQLError("Bill category not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        if (!home) {
          throw new GraphQLError("Home not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        ensureUserCanAccessHome(home, userEmail);

        if (category.home.toString() !== args.homeId) {
          throw new GraphQLError("Category does not belong to the specified home", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        let imageUrl: string | null = null;
        if (args.image != null) {
          if (!isUploadLike(args.image)) {
            throw new GraphQLError("Invalid upload payload", {
              extensions: { code: "BAD_USER_INPUT" },
            });
          }

          imageUrl = await processAndSaveBillImage(args.image as File);
        }

        const bill = await Bill.create({
          date,
          remarks: args.remarks?.trim(),
          imageUrl,
          category: args.categoryId,
          home: args.homeId,
        });

        await bill.populate("category");
        return bill;
      } catch (error) {
        throwInternalError(error);
      }
    },

    updateBill: async (
      _parent: unknown,
      args: { billId: string; date: string; remarks?: string; categoryId: string },
      context: GraphQLContext
    ) => {
      try {
        const userEmail = requireUserEmail(context);
        const { bill, home } = await requireAccessibleBillWithHome(args.billId, userEmail);
        assertObjectId(args.categoryId, "categoryId");

        const nextCategory = await BillCategory.findById(args.categoryId);
        if (!nextCategory) {
          throw new GraphQLError("Bill category not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        if (nextCategory.home.toString() !== home.id.toString()) {
          throw new GraphQLError("Category does not belong to this home", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        bill.date = parseIsoDate(args.date);
        bill.remarks = args.remarks?.trim() ?? "";
        bill.category = nextCategory._id;
        await bill.save();
        await bill.populate("category");

        return bill;
      } catch (error) {
        throwInternalError(error);
      }
    },

    deleteBill: async (_parent: unknown, args: { billId: string }, context: GraphQLContext) => {
      try {
        const userEmail = requireUserEmail(context);
        const { bill } = await requireAccessibleBillWithHome(args.billId, userEmail);
        await bill.deleteOne();
        return true;
      } catch (error) {
        throwInternalError(error);
      }
    },
  },

  Home: {
    owners: (parent: { owners?: string[]; ownerEmail?: string | null }) => getHomeOwners(parent),
    pendingInvites: (parent: { pendingInvites?: string[] }) => getPendingInvites(parent),
    categories: async (parent: { id: string }) => {
      try {
        return await BillCategory.find({ home: parent.id }).sort({ createdAt: -1 });
      } catch (error) {
        throwInternalError(error);
      }
    },
    bills: async (parent: { id: string }) => {
      try {
        return await Bill.find({ home: parent.id }).sort({ date: -1, createdAt: -1 });
      } catch (error) {
        throwInternalError(error);
      }
    },
  },

  BillCategory: {
    home: async (parent: { home: string }) => {
      try {
        return await Home.findById(parent.home);
      } catch (error) {
        throwInternalError(error);
      }
    },
    bills: async (parent: { id: string }) => {
      try {
        return await Bill.find({ category: parent.id }).sort({ date: -1, createdAt: -1 });
      } catch (error) {
        throwInternalError(error);
      }
    },
  },

  Bill: {
    category: (parent: { category: unknown }) => {
      if (parent.category && typeof parent.category === "object") {
        return parent.category;
      }

      return BillCategory.findById(parent.category as string).catch((error) => throwInternalError(error));
    },
    home: async (parent: { home: string }) => {
      try {
        return await Home.findById(parent.home);
      } catch (error) {
        throwInternalError(error);
      }
    },
    date: (parent: { date: Date }) => parent.date.toISOString(),
  },
};
