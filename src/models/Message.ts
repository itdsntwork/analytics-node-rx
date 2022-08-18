import { v4 as uuid } from "uuid";
import md5 from "md5";
import { object } from "yup";
import * as yup from "yup";

class Message {
  messageId: string;
  userId: string;
  anonymousId: string;
  event?: string;
  type: Type;
  context: any;
  _metadata: any;
  timestamp: Date;
  integrations?: { [key: string]: boolean };
  groupId?: string;
  traits?: Traits;
  properties?: Properties;
  category?: string;
  previousId?: string;

  constructor(params: MessageParams, type: Type, version: string) {
    this.context = {
      ...params?.context,
      library: {
        name: "analytics-node",
        version,
      },
    };
    this._metadata = {
      ...params?._metadata,
      nodeVersion: process.versions.node,
    };
    this.timestamp = new Date();
    this.type = type;
    this.messageId =
      params.messageId || `node-${md5(JSON.stringify({ ...this }))}-${uuid()}`;

    this.anonymousId = JSON.stringify(params.anonymousId);
    this.userId = JSON.stringify(params.userId);

    this.event = (params as TrackParams).event;
    this.integrations = params.integrations;
    this.groupId = (params as GroupParams).groupId;
    this.traits = (params as IdentifyParams).traits;
    this.properties = (params as TrackParams).properties;
    this.category = (params as PageParams).category;
    this.previousId = (params as AliasParams).previousId;
  }

  public static async validateParams(params: MessageParams, type: Type) {
    await validationSchema.validate({ ...params, type });
  }
}

const validationSchema = object().shape(
  {
    type: yup
      .string()
      .required()
      .oneOf(["identify", "group", "track", "page", "screen", "alias"]),
    userId: yup.string().when("anonymousId", {
      is: (anonymousId: string) => !anonymousId,
      then: yup.string().required(),
      otherwise: yup.string(),
    }),
    anonymousId: yup.string().when("userId", {
      is: (userId: string) => !userId,
      then: yup.string().required(),
      otherwise: yup.string(),
    }),
    event: yup.string().when("type", {
      is: (type: Type) => type === "track",
      then: yup.string().required(),
      otherwise: yup.string(),
    }),
    groupId: yup.string().when("type", {
      is: (type: Type) => type === "group",
      then: yup.string().required(),
      otherwise: yup.string(),
    }),
    previousId: yup.string().when("type", {
      is: (type: Type) => type === "alias",
      then: yup.string().required(),
      otherwise: yup.string(),
    }),
  },
  [["userId", "anonymousId"]]
);

export type Type = "identify" | "group" | "track" | "page" | "screen" | "alias";

type MessageParams =
  | IdentifyParams
  | TrackParams
  | GroupParams
  | PageParams
  | AliasParams;

interface BaseParams {
  userId?: string;
  anonymousId?: string;
  messageId?: string;
  context?: any;
  integrations?: { [key: string]: boolean };
  _metadata?: any;
}

interface IdentifyParams extends BaseParams {
  traits?: Traits;
}

interface GroupParams extends BaseParams {
  groupId: string;
  traits?: Traits;
}

interface TrackParams extends BaseParams {
  event: string;
  properties?: Properties;
}

interface PageParams extends BaseParams {
  category?: string;
  properties?: Properties;
}

interface AliasParams extends BaseParams {
  previousId: string;
}

interface Traits extends DynamicObject {
  address?: {
    city?: string;
    country?: string;
    postalCode?: string;
    state?: string;
    street?: string;
  };
  age?: number;
  avatar?: string;
  birthday?: Date;
  company?: {
    name?: string;
    id?: string | number;
    industry?: string;
    employee_count: number;
    plan: string;
  };
  created?: Date;
  description?: string;
  email?: string;
  firstName?: string;
  gender?: string;
  id?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  title?: string;
  username?: string;
  website?: string;
}

interface Properties extends DynamicObject {
  name?: string;
  path?: string;
  referrer?: string;
  search?: string;
  title?: string;
  url?: string;
  keywords?: string[];
}

type DynamicObject = { [key: string]: any };

export { Message, MessageParams };
