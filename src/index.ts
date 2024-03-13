#!/usr/bin/env node

import axios from "axios";
import cheerio from "cheerio";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import os from "os";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const defaultOutputDirectory = os.homedir();
const outputDirectory = process.env.OUTPUT_DIRECTORY ?? defaultOutputDirectory;
console.log(`Using output directory: ${outputDirectory}`); // Log the output directory being used

/**
 * Configures command line arguments using yargs.
 */
const argv = yargs(hideBin(process.argv))
  .option("metadata", {
    alias: "m",
    type: "boolean",
    description: "Fetch and display metadata",
    default: false,
  })
  .option("mirror", {
    alias: "mirror",
    type: "boolean",
    description: "Mirror the content",
    default: false,
  })
  .parseSync();

console.log(
  "Yargs configuration complete. Metadata:",
  argv.metadata,
  "Mirror:",
  argv.mirror
); // Log command line arguments

/**
 * Defines the structure for site metadata.
 */
interface SiteMetadata {
  site: string;
  num_links: number;
  images: number;
  last_fetch: string;
}

/**
 * Fetches and parses the content of a given URL.
 * @param {string} url - The URL to fetch and parse.
 * @param {boolean} [metadata=false] - Whether to fetch and display metadata.
 */
async function fetchAndParseURL(url: string, metadata = false): Promise<void> {
  if (!isValidUrl(url)) {
    console.log(`Invalid URL skipped: ${url}`);
    return;
  }

  console.log(`Processing URL: ${url}`);

  try {
    const { data } = await axios.get(url);
    console.log(`Data fetched for URL: ${url}`);
    const $ = cheerio.load(data);

    if (metadata) {
      const siteMetadata: SiteMetadata = {
        site: url,
        num_links: $("a").length,
        images: $("img").length,
        last_fetch: new Date().toUTCString(),
      };

      console.log("Metadata:", siteMetadata);
    }

    const filename = path.join(
      outputDirectory,
      extractDomainName(url) + ".html"
    );
    fs.writeFileSync(filename, $.html(), "utf-8");
    console.log(`Content saved: ${filename}`);
  } catch (error) {
    console.error(`An error occurred while fetching ${url}: `, error);
  }
}

/**
 * Validates a given URL.
 * @param {string} urlString - The URL to validate.
 * @returns {boolean} True if the URL is valid, false otherwise.
 */
function isValidUrl(urlString: string): boolean {
  if (!urlString) {
    return false;
  }
  try {
    new URL(urlString);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Mirrors the content and assets of a given URL using Puppeteer.
 * @param {string} url - The URL to mirror.
 */
async function mirror(url: string): Promise<void> {
  console.log(`Starting mirroring for URL: ${url}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle0" });
  console.log(`Page loaded for mirroring: ${url}`);

  const content = await page.content();
  const urlObj = new URL(url);
  const dirPath = path.join(outputDirectory, urlObj.hostname);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Directory created: ${dirPath}`);
  }

  const indexPath = path.join(dirPath, "index.html");
  fs.writeFileSync(indexPath, content);
  console.log(`Main content saved: ${indexPath}`);

  const assets = await page.evaluate(() => {
    const urls: string[] = [];
    document
      .querySelectorAll('img, link[rel="stylesheet"], script')
      .forEach((element) => {
        if (element instanceof HTMLImageElement && element.src) {
          urls.push(element.src);
        } else if (element instanceof HTMLLinkElement && element.href) {
          urls.push(element.href);
        } else if (element instanceof HTMLScriptElement && element.src) {
          urls.push(element.src);
        }
      });
    return urls;
  });

  for (const assetUrl of assets) {
    if (!assetUrl.startsWith("http://") && !assetUrl.startsWith("https://")) {
      console.error(`Skipping invalid asset URL: ${assetUrl}`);
      continue;
    }

    try {
      const response = await page.goto(assetUrl);
      if (response) {
        const buffer = await response.buffer();
        const assetPath = path.join(dirPath, new URL(assetUrl).pathname);
        fs.mkdirSync(path.dirname(assetPath), { recursive: true }); // Make sure the directory exists
        fs.writeFileSync(assetPath, buffer);
        console.log(`Asset saved: ${assetPath}`);
      } else {
        console.error(`No response received for asset: ${assetUrl}`);
      }
    } catch (error) {
      console.error(`Failed to download asset: ${assetUrl}`, error);
    }
  }

  await browser.close();
  console.log(`Mirroring completed for URL: ${url}`);
}

/**
 * The main function to run the script. Processes URLs provided via CLI for content and optionally mirroring.
 */
async function main() {
  const urls: string[] = argv._ as string[];
  console.log("Starting processing with URLs:", urls);

  const fetchPromises = urls.map((url) => fetchAndParseURL(url, argv.metadata));
  await Promise.all(fetchPromises);

  if (argv.mirror) {
    console.log("Starting mirroring process...");
    const mirrorPromises = urls.map((url) => mirror(url));
    await Promise.all(mirrorPromises);
    console.log("Mirroring process completed.");
  }
}

/**
 * Extracts the domain name from a URL.
 * @param {string} url - The URL to extract the domain from.
 * @returns {string} The extracted domain name.
 */
function extractDomainName(url: string): string {
  return new URL(url).hostname;
}

main();
