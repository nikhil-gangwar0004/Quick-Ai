import OpenAI from "openai";
import sql from "../config/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { PdfReader } from "pdfreader";

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({ success: false, message: "Limit reached. Upgrade to continue." });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: length,
    });

    const content = response.choices[0].message.content;
    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'article')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }
    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({ success: false, message: "Limit reached. Upgrade to continue." });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    if (!content) return res.json({ success: false, message: "No content generated" });

    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }
    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({ success: false, message: "This feature is only available for premium subscriptions." });
    }

    const formData = new FormData();
    formData.append("prompt", prompt);
    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      { headers: { "x-api-key": process.env.CLIPDROP_API_KEY }, responseType: "arraybuffer" }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(data, "binary").toString("base64")}`;
    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    await sql`INSERT INTO creations (user_id, prompt, content, type, publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({ success: false, message: "This feature is only available for premium subscriptions." });
    }

    if (!req.file) {
      return res.json({ success: false, message: "No image uploaded." });
    }

    const formData = new FormData();
    const imageBlob = new Blob([fs.readFileSync(req.file.path)], { type: req.file.mimetype });
    formData.append("image_file", imageBlob, req.file.originalname);

    const { data } = await axios.post(
      "https://clipdrop-api.co/remove-background/v1",
      formData,
      { headers: { "x-api-key": process.env.CLIPDROP_API_KEY }, responseType: "arraybuffer" }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(data, "binary").toString("base64")}`;
    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')`;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({ success: false, message: "This feature is only available for premium subscriptions." });
    }

    if (!req.file) {
      return res.json({ success: false, message: "No image uploaded." });
    }

    const formData = new FormData();
    const imageBlob = new Blob([fs.readFileSync(req.file.path)], { type: req.file.mimetype });
    formData.append("image_file", imageBlob, req.file.originalname);
    formData.append("object", object);

    const { data } = await axios.post(
      "https://clipdrop-api.co/remove-object/v1",
      formData,
      { headers: { "x-api-key": process.env.CLIPDROP_API_KEY }, responseType: "arraybuffer" }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(data, "binary").toString("base64")}`;
    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    const promptText = `Remove ${object} from image`;
    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${promptText}, ${secure_url}, 'image')`;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({ success: false, message: "This feature is only available for premium subscriptions." });
    }

    if (!resume) {
      return res.json({ success: false, message: "No resume uploaded." });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.json({ success: false, message: "Resume file size exceeds allowed size (5MB)." });
    }

    const dataBuffer = fs.readFileSync(resume.path);

    const pdfText = await new Promise((resolve, reject) => {
      const reader = new PdfReader();
      let text = "";
      reader.parseBuffer(dataBuffer, (err, item) => {
        if (err) reject(err);
        else if (!item) resolve(text);
        else if (item.text) text += item.text + " ";
      });
    });

    const prompt = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement. Resume Content:\n\n${pdfText}`;

    const response = await AI.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;

    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};