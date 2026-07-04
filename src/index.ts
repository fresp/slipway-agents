import { loadAgentDefinitions } from "./config/loader";
import { loadSlipwayConfig } from "./config/loader";
import { applyAgentConfig } from "./plugin-handlers/agent-config-handler";
import { registerPipelineHooks } from "./hooks/pipeline-hooks";
import { registerSessionErrorHook } from "./hooks/session-error-hook";
import { Hooks, PluginInput } from "./config/types";

export default {
  server: async (_input: PluginInput): Promise<Hooks> => {
    const agentDefinitions = loadAgentDefinitions();
    const slipwayConfig = loadSlipwayConfig();

    if (Object.keys(agentDefinitions).length === 0) {
      console.warn(
        "[slipway-agents] No agents loaded — plugin will not register any agents"
      );
      return {};
    }

    return {
      config: async (input) => {
        await applyAgentConfig(input, agentDefinitions, slipwayConfig);
      },
      ...registerSessionErrorHook(),
      ...registerPipelineHooks(),
    };
  },
};
