import { Tool } from "@anthropic-ai/sdk/resources/messages.mjs";

export type ToolRiskLevel = "LOW_IMPACT" | "HIGH_IMPACT";

export interface ToolPolicy {
  riskLevel: ToolRiskLevel;
  requiresApproval: boolean;
  description: string;
}

export const TOOL_POLICIES: Record<string, ToolPolicy> = {
  fetch_campaign_metrics: {
    riskLevel: "LOW_IMPACT",
    requiresApproval: false,
    description: "Fetches performance metrics (spend, CPA, ROAS, CTR) for campaigns"
  },
  get_campaign_status: {
    riskLevel: "LOW_IMPACT",
    requiresApproval: false,
    description: "Reads configuration and live status of an ad campaign"
  },
  update_campaign_budget: {
    riskLevel: "HIGH_IMPACT",
    requiresApproval: true,
    description: "Modifies the daily budget for a campaign (involves financial expenditure)"
  },
  pause_ad_set: {
    riskLevel: "HIGH_IMPACT",
    requiresApproval: true,
    description: "Halts delivery of an ad set, affecting active live traffic and revenue"
  },
  reallocate_budget: {
    riskLevel: "HIGH_IMPACT",
    requiresApproval: true,
    description: "Moves budget allocation from an underperforming campaign to a top performer"
  }
};

export const AGENT_TOOLS: Tool[] = [
  {
    name: "fetch_campaign_metrics",
    description: "Fetch live performance metrics for a given Meta or Google Ads campaign.",
    input_schema: {
      type: "object",
      properties: {
        platform: {
          type: "string",
          enum: ["meta", "google_ads"],
          description: "Ad platform name"
        },
        campaign_id: {
          type: "string",
          description: "Identifier of the target campaign"
        },
        date_range: {
          type: "string",
          enum: ["today", "last_7_days", "last_30_days"],
          description: "Metrics time window"
        }
      },
      required: ["platform", "campaign_id"]
    }
  },
  {
    name: "get_campaign_status",
    description: "Inspect the current status, bid strategy, and health of a campaign.",
    input_schema: {
      type: "object",
      properties: {
        platform: {
          type: "string",
          enum: ["meta", "google_ads"]
        },
        campaign_id: {
          type: "string"
        }
      },
      required: ["platform", "campaign_id"]
    }
  },
  {
    name: "update_campaign_budget",
    description: "Update the daily spending budget of an active ad campaign. HIGH IMPACT: Triggers financial change.",
    input_schema: {
      type: "object",
      properties: {
        platform: {
          type: "string",
          enum: ["meta", "google_ads"]
        },
        campaign_id: {
          type: "string"
        },
        current_daily_budget_usd: {
          type: "number",
          description: "The current budget before change"
        },
        new_daily_budget_usd: {
          type: "number",
          description: "The proposed new daily budget in USD"
        },
        reason: {
          type: "string",
          description: "Clear business justification for why this budget change is recommended"
        }
      },
      required: ["platform", "campaign_id", "current_daily_budget_usd", "new_daily_budget_usd", "reason"]
    }
  },
  {
    name: "pause_ad_set",
    description: "Pause an underperforming ad set to stop ad spend bleeding. HIGH IMPACT: Stops traffic.",
    input_schema: {
      type: "object",
      properties: {
        platform: {
          type: "string",
          enum: ["meta", "google_ads"]
        },
        campaign_id: {
          type: "string"
        },
        ad_set_id: {
          type: "string"
        },
        reason: {
          type: "string",
          description: "Reason why pausing this ad set is necessary"
        }
      },
      required: ["platform", "campaign_id", "ad_set_id", "reason"]
    }
  },
  {
    name: "reallocate_budget",
    description: "Reallocate budget from a decaying campaign to a scaling campaign. HIGH IMPACT: Adjusts multiple budgets.",
    input_schema: {
      type: "object",
      properties: {
        source_campaign_id: {
          type: "string",
          description: "Campaign with poor ROAS to reduce budget from"
        },
        target_campaign_id: {
          type: "string",
          description: "Top-performing campaign to increase budget for"
        },
        amount_usd: {
          type: "number",
          description: "Daily USD amount to transfer"
        },
        reason: {
          type: "string"
        }
      },
      required: ["source_campaign_id", "target_campaign_id", "amount_usd", "reason"]
    }
  }
];
