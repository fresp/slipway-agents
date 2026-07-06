import { loadAgentDefinitions } from "./config/loader";
import { loadSlipwayConfig } from "./config/loader";
import { applyAgentConfig } from "./plugin-handlers/agent-config-handler";
import { applyCommandConfig } from "./plugin-handlers/command-config-handler";
import { registerPipelineHooks } from "./hooks/pipeline-hooks";
import { Hooks, PluginInput } from "./config/types";

export default {
  id: "slipway-agents",
  server: async (_input: PluginInput): Promise<Hooks> => {
    const agentDefinitions = loadAgentDefinitions();
    const projectRoot = _input.project?.directory ?? _input.directory;
    const slipwayConfig = loadSlipwayConfig(projectRoot);

    if (Object.keys(agentDefinitions).length === 0) {
      console.warn(
        "[slipway-agents] No agents loaded — plugin will not register any agents"
      );
      return {};
    }

    return {
      config: async (input) => {
        await applyAgentConfig(input, agentDefinitions, slipwayConfig);
        await applyCommandConfig(input, slipwayConfig);
      },
      ...registerPipelineHooks(),
    };
  },
};
