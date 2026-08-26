export interface ToolExecutionResult {
  success: boolean;
  data: any;
  message: string;
}

export class AdPlatformMockExecutor {
  public static async execute(toolName: string, args: Record<string, any>): Promise<ToolExecutionResult> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    switch (toolName) {
      case "fetch_campaign_metrics":
        return this.mockFetchMetrics(args);

      case "get_campaign_status":
        return this.mockGetStatus(args);

      case "update_campaign_budget":
        return this.mockUpdateBudget(args);

      case "pause_ad_set":
        return this.mockPauseAdSet(args);

      case "reallocate_budget":
        return this.mockReallocateBudget(args);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private static mockFetchMetrics(args: any): ToolExecutionResult {
    return {
      success: true,
      message: `Retrieved metrics for campaign ${args.campaign_id} on ${args.platform}`,
      data: {
        campaign_id: args.campaign_id,
        platform: args.platform,
        period: args.date_range || "today",
        spend_usd: 480.50,
        impressions: 42300,
        clicks: 840,
        ctr_percent: 1.98,
        conversions: 12,
        cost_per_acquisition_usd: 40.04,
        target_cpa_usd: 25.00,
        roas: 1.15,
        status: "ALERT_HIGH_CPA",
        recommendation: "CPA is 60% above target threshold ($25.00). Action required."
      }
    };
  }

  private static mockGetStatus(args: any): ToolExecutionResult {
    return {
      success: true,
      message: `Status retrieved for campaign ${args.campaign_id}`,
      data: {
        campaign_id: args.campaign_id,
        status: "ACTIVE",
        daily_budget_usd: 500.00,
        bid_strategy: "MAXIMIZE_CONVERSIONS",
        ad_sets: [
          { id: "adset_retargeting_01", name: "Retargeting 30d", status: "ACTIVE", cpa: 48.20, spend: 320.00 },
          { id: "adset_lookalike_02", name: "Lookalike 1% Buyers", status: "ACTIVE", cpa: 21.50, spend: 160.50 }
        ]
      }
    };
  }

  private static mockUpdateBudget(args: any): ToolExecutionResult {
    return {
      success: true,
      message: `Successfully updated campaign ${args.campaign_id} budget from $${args.current_daily_budget_usd} to $${args.new_daily_budget_usd}/day.`,
      data: {
        mutation_id: `mut_${Date.now()}`,
        platform: args.platform,
        campaign_id: args.campaign_id,
        previous_budget_usd: args.current_daily_budget_usd,
        new_budget_usd: args.new_daily_budget_usd,
        applied_at: new Date().toISOString(),
        status: "ACTIVE_NEW_BUDGET"
      }
    };
  }

  private static mockPauseAdSet(args: any): ToolExecutionResult {
    return {
      success: true,
      message: `Ad set ${args.ad_set_id} has been paused on ${args.platform}.`,
      data: {
        mutation_id: `mut_${Date.now()}`,
        campaign_id: args.campaign_id,
        ad_set_id: args.ad_set_id,
        status: "PAUSED",
        paused_at: new Date().toISOString(),
        reason: args.reason
      }
    };
  }

  private static mockReallocateBudget(args: any): ToolExecutionResult {
    return {
      success: true,
      message: `Reallocated $${args.amount_usd} from ${args.source_campaign_id} to ${args.target_campaign_id}.`,
      data: {
        mutation_id: `mut_${Date.now()}`,
        source_campaign_id: args.source_campaign_id,
        target_campaign_id: args.target_campaign_id,
        amount_usd: args.amount_usd,
        applied_at: new Date().toISOString()
      }
    };
  }
}
