import { describe, expect, test } from "vitest";
import { registerSchema as registerOpenApi30, validate as validateOpenApi30 } from "@hyperjump/json-schema/openapi-3-0";
import { registerSchema as registerOpenApi31, validate as validateOpenApi31 } from "@hyperjump/json-schema/openapi-3-1";
import { registerSchema as registerOpenApi32, validate as validateOpenApi32 } from "@hyperjump/json-schema/openapi-3-2";
import { BASIC } from "@hyperjump/json-schema/experimental";
import { jsonSchemaErrors } from "./index.js";

/**
 * @import { Json, ErrorObject } from "./index.js"
 * @import { SchemaObject } from "@hyperjump/json-schema"
 */

const dialect30 = "https://spec.openapis.org/oas/3.0/dialect";
const dialect31 = "https://spec.openapis.org/oas/3.1/dialect/base";
const dialect32 = "https://spec.openapis.org/oas/3.2/dialect";

/** @type (errors: ErrorObject[]) => string[] */
const messages = (errors) => errors.map(({ message }) => message);

/** @type (errors: ErrorObject[], schemaUri: string) => string[] */
const relativeLocations = (errors, schemaUri) => errors
  .flatMap(({ schemaLocations }) => schemaLocations)
  .map((schemaLocation) => schemaLocation.replace(schemaUri, ""));

/** @type (register: (schema: any, uri: string, dialect: string) => void, validate: (uri: string, instance: Json, format: typeof BASIC) => Promise<any>, dialectUri: string, schema: SchemaObject, instance: Json) => Promise<{ schemaUri: string; errors: ErrorObject[] }> */
const getErrors = async (register, validate, dialectUri, schema, instance) => {
  const schemaUri = `https://example.com/openapi/${crypto.randomUUID()}`;
  register(schema, schemaUri, dialectUri);
  const output = await validate(schemaUri, instance, BASIC);
  return { schemaUri, errors: await jsonSchemaErrors(output, schemaUri, instance) };
};

const annotationKeywords = {
  example: "an example",
  externalDocs: { url: "https://example.com" },
  xml: { name: "value" },
  discriminator: { propertyName: "value" }
};

describe("OpenAPI 3.0", () => {
  test("type is asserted", async () => {
    const { schemaUri, errors } = await getErrors(registerOpenApi30, validateOpenApi30, dialect30, {
      type: "string"
    }, 5);

    expect(messages(errors)).to.eql(["Expected a string"]);
    expect(relativeLocations(errors, schemaUri)).to.eql(["#/type"]);
  });

  test("null is allowed when nullable", async () => {
    const { errors } = await getErrors(registerOpenApi30, validateOpenApi30, dialect30, {
      type: "string",
      nullable: true
    }, null);

    expect(errors).to.eql([]);
  });

  test("nullable expands the allowed types", async () => {
    const { errors } = await getErrors(registerOpenApi30, validateOpenApi30, dialect30, {
      type: "string",
      nullable: true
    }, 5);

    expect(messages(errors)).to.eql(["Expected a value of type null or string"]);
  });

  test("annotation keywords are ignored", async () => {
    const { errors } = await getErrors(registerOpenApi30, validateOpenApi30, dialect30, {
      type: "string",
      ...annotationKeywords
    }, 5);

    expect(messages(errors)).to.eql(["Expected a string"]);
  });

  test("annotations allow any value when used alone", async () => {
    const { errors } = await getErrors(registerOpenApi30, validateOpenApi30, dialect30, {
      example: "an example",
      externalDocs: { url: "https://example.com" },
      xml: { name: "value" },
      discriminator: { propertyName: "value" }
    }, 5);

    expect(errors).to.eql([]);
  });
});

describe("OpenAPI 3.1", () => {
  test("type is asserted and annotation keywords are ignored", async () => {
    const { schemaUri, errors } = await getErrors(registerOpenApi31, validateOpenApi31, dialect31, {
      type: "string",
      ...annotationKeywords
    }, 5);

    expect(messages(errors)).to.eql(["Expected a string"]);
    expect(relativeLocations(errors, schemaUri)).to.eql(["#/type"]);
  });
});

describe("OpenAPI 3.2", () => {
  test("type is asserted and annotation keywords are ignored", async () => {
    const { schemaUri, errors } = await getErrors(registerOpenApi32, validateOpenApi32, dialect32, {
      type: "string",
      ...annotationKeywords
    }, 5);

    expect(messages(errors)).to.eql(["Expected a string"]);
    expect(relativeLocations(errors, schemaUri)).to.eql(["#/type"]);
  });
});
