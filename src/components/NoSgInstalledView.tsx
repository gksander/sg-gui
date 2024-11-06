import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

/**
 * This is ugly as shit, but does the job (roughly).
 * TODO: clean this up, make it much nicer - this may be the entry point
 */
export function NoSgInstalledView() {
  return (
    <div className="p-8">
      <div>
        <code>ast-grep</code> is not installed and/or not able to be executed
        via the <code>sg</code> command.
      </div>
      <div>
        Follow the{" "}
        <a href="https://ast-grep.github.io/guide/quick-start.html#installation">
          installation instructions
        </a>{" "}
        to install it.
      </div>

      <div>
        <Button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["check-sg-installed"] })
          }
        >
          Check again
        </Button>
      </div>
    </div>
  );
}
