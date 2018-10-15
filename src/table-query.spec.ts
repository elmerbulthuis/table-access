import * as test from "blue-tape";
import { using } from "dispose";
import { PgContext } from "pg-context";
import { UnexpectedRowCountError, UniqueConstraintError } from "./error";
import { TableDescriptor } from "./table-descriptor";
import { TableQuery } from "./table-query";

const sql = `
CREATE TABLE public.one(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
INSERT INTO public.one(name)
VALUES('one'), ('two');
`;

interface OneTableRow {
    id: number;
    name: string;
}

const OneTableDescriptor: TableDescriptor<OneTableRow> = {
    schema: "public",
    table: "one",
};

test(
    "TableQuery#single",
    async t => using(PgContext.create(sql), async ({ pool }) => {
        {
            const row = await TableQuery.query(pool, q => q.single(
                OneTableDescriptor,
                { id: 2 },
            ));

            t.deepEqual(row, { id: 2, name: "two" });
        }
        try {
            const row = await TableQuery.query(pool, q => q.single(
                OneTableDescriptor,
                { id: 4 },
            ));

            t.fail();
        }
        catch (err) {
            t.ok(err instanceof UnexpectedRowCountError);
        }
    }),
);

test(
    "TableQuery#singleOrNull",
    async t => using(PgContext.create(sql), async ({ pool }) => {
        {
            const row = await TableQuery.query(pool, q => q.singleOrNull(
                OneTableDescriptor,
                { id: 2 },
            ));

            t.deepEqual(row, { id: 2, name: "two" });
        }

        {
            const row = await TableQuery.query(pool, q => q.singleOrNull(
                OneTableDescriptor,
                { id: 4 },
            ));

            t.equal(row, null);
        }
    }),

);

test(
    "TableQuery#multiple",
    async t => using(PgContext.create(sql), async ({ pool }) => {
        const rows = await TableQuery.query(pool, q => q.multiple(
            OneTableDescriptor,
            { id: 2 },
        ));

        t.deepEqual(rows, [{ id: 2, name: "two" }]);
    }),
);

test(
    "TableQuery#insert",
    async t => using(PgContext.create(sql), async ({ pool }) => {
        {
            const row = await TableQuery.query(pool, q => q.insert(
                OneTableDescriptor,
                { name: "three" },
            ));

            t.deepEqual(row, { id: 3, name: "three" });
        }

        try {
            const row = await TableQuery.query(pool, q => q.insert(
                OneTableDescriptor,
                { id: 1, name: "four" },
            ));

            t.fail();
        }
        catch (err) {
            t.ok(err instanceof UniqueConstraintError);
        }

        try {
            const row = await TableQuery.query(pool, q => q.insert(
                OneTableDescriptor,
                { id: 5, name: "one" },
            ));

            t.fail();
        }
        catch (err) {
            t.ok(err instanceof UniqueConstraintError);
        }
    }),
);

test(
    "TableQuery#update",
    async t => using(PgContext.create(sql), async ({ pool }) => {
        {
            const row = await TableQuery.query(pool, q => q.update(
                OneTableDescriptor,
                { name: "one" },
                { name: "een" },
            ));

            t.deepEqual(row, { id: 1, name: "een" });
        }

        try {
            const row = await TableQuery.query(pool, q => q.update(
                OneTableDescriptor,
                { name: "one" },
                { name: "een" },
            ));

            t.fail();
        }
        catch (err) {
            t.ok(err instanceof UnexpectedRowCountError);
        }
    }),
);

test(
    "TableQuery#upsert",
    async t => using(PgContext.create(sql), async ({ pool }) => {
        const row = await TableQuery.query(pool, q => q.upsert(
            OneTableDescriptor,
            { id: 2 },
            { name: "twee" },
        ));

        t.deepEqual(row, { id: 2, name: "twee" });
    }),
);

test(
    "TableQuery#delete",
    async t => using(PgContext.create(sql), async ({ pool }) => {
        const row = await TableQuery.query(pool, q => q.delete(
            OneTableDescriptor,
            { id: 2 },
        ));

        t.deepEqual(row, { id: 2, name: "two" });
    }),
);
