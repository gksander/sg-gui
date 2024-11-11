import { Button } from "@/client/components/ui/button";
import { VscReplaceAll } from "react-icons/vsc";

type Props = {
  onClick: (evt: React.MouseEvent<HTMLButtonElement>) => void;
  multiple?: boolean;
  isLoading?: boolean;
};

export function ReplaceButton({ onClick, isLoading, multiple = false }: Props) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      disabled={isLoading}
      className="text-xs"
    >
      {multiple ? "Apply all" : "Apply"}
      <VscReplaceAll className="ml-1" />
    </Button>
  );
}
