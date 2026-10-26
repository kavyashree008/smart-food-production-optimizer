import { ProductionPlan } from "../models/ProductionPlan.js";
import { explainPlanWithAI, chatWithAIAssistant } from "../services/aiService.js";

export async function explainPlan(req, res, next) {
  try {
    const plan = await ProductionPlan.findById(req.params.planId).populate("productId");
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    const explanation = await explainPlanWithAI(plan);
    return res.status(200).json({ success: true, explanation, aiExplanation: plan.aiExplanation });
  } catch (error) {
    return next(error);
  }
}

export async function chatAssistant(req, res, next) {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: "Messages array required" });
    }

    const aiRes = await chatWithAIAssistant({
      messages,
      userRole: req.user?.role || "manager",
      userName: req.user?.name || "User"
    });

    const replyText = typeof aiRes === "string" ? aiRes : (aiRes?.content || JSON.stringify(aiRes));

    return res.status(200).json({
      success: true,
      message: replyText,
      reply: replyText,
      toolCalls: aiRes?.toolCalls || []
    });
  } catch (error) {
    return next(error);
  }
}