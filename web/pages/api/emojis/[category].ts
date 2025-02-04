// pages/api/emojis/[category].ts
import type { NextApiRequest, NextApiResponse } from "next";

// Constants
const GITHUB_API_BASE =
    "https://api.github.com/repos/insertfahim/Animated-Fluent-Emojis/contents";

const CATEGORIES: Record<string, string> = {
    smilies: "Smilies",
    "hand-gestures": "Hand gestures",
    people: "People",
    "people-with-activities": "People with activities",
    "people-with-professions": "People with professions",
    animals: "Animals",
    food: "Food",
    activities: "Activities",
    "travel-and-places": "Travel and places",
    objects: "Objects",
    symbols: "Symbols",
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { category } = req.query;

        // Handle missing or invalid category
        if (!category || Array.isArray(category)) {
            return res.status(400).json({
                error: "Invalid category parameter",
                emojis: [],
            });
        }

        // Normalize the input category to match our keys
        const normalizedCategory = category
            .toLowerCase()
            .replace(/%20/g, "-")
            .replace(/ /g, "-");

        console.log("🔍 Normalized category:", normalizedCategory);

        // Get the actual folder name from our map
        const folderName = CATEGORIES[normalizedCategory];
        console.log("📂 Mapped to folder:", folderName);

        if (!folderName) {
            console.log(
                "❌ No mapping found for category:",
                normalizedCategory
            );
            return res.status(200).json({
                category: normalizedCategory,
                emojis: [],
            });
        }

        // Construct and encode the URL properly
        const url = `${GITHUB_API_BASE}/Emojis/${encodeURIComponent(
            folderName
        )}`;
        console.log("🌐 Fetching from:", url);

        const response = await fetch(url, {
            headers: {
                Accept: "application/vnd.github.v3+json",
                ...(process.env.GITHUB_TOKEN && {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`,
                }),
            },
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();

        // Process emoji data
        const emojis = data
            .filter(
                (item: any) =>
                    item.type === "file" && item.name.endsWith(".png")
            )
            .map((item: any) => ({
                name: item.name,
                download_url: item.download_url,
            }));

        console.log("✨ Found", emojis.length, "emojis");

        return res.status(200).json({
            category: folderName,
            emojis,
        });
    } catch (error) {
        console.error("🚨 Error in API route:", error);
        return res.status(200).json({
            category:
                typeof req.query.category === "string"
                    ? req.query.category
                    : "",
            emojis: [],
        });
    }
}
