import type { MessageInitShape } from "@bufbuild/protobuf";
import { ConnectError } from "@connectrpc/connect";
import { useMutation } from "@connectrpc/connect-query";
import { FleetService } from "@swarmops/contracts/control/v1";
import type { CommandSchema } from "@swarmops/contracts/drone/v1";

import { useFleet } from "../store/fleet";

export type CommandKind = NonNullable<MessageInitShape<typeof CommandSchema>["kind"]>;

/** Sends a command with a fresh idempotency key and logs the outcome. */
export function useSendCommand() {
  const pushLog = useFleet((s) => s.pushLog);
  const mutation = useMutation(FleetService.method.sendCommand);

  return (droneId: string, kind: CommandKind) => {
    mutation.mutate(
      { droneId, command: { kind }, idempotencyKey: crypto.randomUUID() },
      {
        onSuccess: (res) =>
          pushLog({ level: "info", droneId, text: `${kind.case} → ${res.command?.commandId ?? "?"} sent` }),
        onError: (err) =>
          pushLog({ level: "error", droneId, text: `${kind.case} failed: ${ConnectError.from(err).rawMessage}` }),
      },
    );
  };
}
