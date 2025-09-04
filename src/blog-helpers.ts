import fs from "fs";
import path from "path";
import matter from "gray-matter";

const blogPostsDir = "blog-posts";

export const postFileNameToParams = (fileName: string) => {
  const [year, month, day, ...slug] = fileName.replace(/\.md$/, "").split("-");
  return { year, month, day, slug: slug.join("-") };
};

export const paramsToPostFileName = (params: {
  year: string;
  month: string;
  day: string;
  slug: string;
}) => {
  const { year, month, day, slug } = params;
  return `${year}-${month}-${day}-${decodeURIComponent(slug)}.md`;
};

export const postFileNameToPath = (fileName: string) => {
  const { year, month, day, slug } = postFileNameToParams(fileName);
  return `/blog/${year}/${month}/${day}/${slug}/`;
};

export const getPostFilePath = (params: {
  year: string;
  month: string;
  day: string;
  slug: string;
}) => {
  const fileName = paramsToPostFileName(params);
  return path.join(blogPostsDir, fileName);
};

export const getAllPostFileNames = () => {
  return fs.readdirSync(blogPostsDir).filter((f) => f !== "README.md");
};

export const getAllPostParams = () => {
  const fileNames = getAllPostFileNames();
  return fileNames.map((fileName) => postFileNameToParams(fileName));
};

export const getPostFileContent = (params: {
  year: string;
  month: string;
  day: string;
  slug: string;
}) => {
  const filePath = getPostFilePath(params);
  return fs.readFileSync(filePath, "utf8");
};

export const getPost = (params: {
  year: string;
  month: string;
  day: string;
  slug: string;
}) => {
  const content = getPostFileContent(params);
  const { data } = matter(content);
  return { frontmatter: data, content };
};

export const getAllPosts = () => {
  const fileNames = getAllPostFileNames();
  return fileNames.map((fileName) => {
    const params = postFileNameToParams(fileName);
    const content = getPostFileContent(params);
    const { data, excerpt } = matter(content, {
      excerpt_separator: "<!-- more -->",
    });
    return {
      frontmatter: data,
      excerpt,
      path: postFileNameToPath(fileName),
      params,
    };
  });
};
