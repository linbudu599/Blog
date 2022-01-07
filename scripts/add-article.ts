import * as fs from "fs-extra";
import * as path from "path";
import * as parse from "yargs-parser";

interface IOption {
  slug: string;
  title: string;
  date: string;
}

const parsed = parse(process.argv.slice(2)) as unknown as IOption;

const mdxInitialContent = ({ title, date, slug }: IOption): string => {
  return `
---
title: "${title}"
date: ${date}
slug: "/${slug}"
---
`;
};

const composeTargetPath = (slug: string) => {
  return path.join(__dirname, "../content/posts", slug);
};

const dir = composeTargetPath(parsed.slug);
const file = path.resolve(dir, "index.mdx");

fs.ensureDirSync(dir);
fs.ensureFileSync(file);

fs.writeFileSync(file, mdxInitialContent(parsed));
