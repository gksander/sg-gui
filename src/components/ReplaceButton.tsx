import { Button } from "@/components/ui/button";
import { VscReplaceAll } from "react-icons/vsc";

type Props = {
  onClick: () => void;
  multiple?: boolean;
  isLoading?: boolean;
};

export function ReplaceButton({ onClick, isLoading, multiple = false }: Props) {
  return (
    <Button variant="ghost" onClick={onClick} disabled={isLoading}>
      <VscReplaceAll className="mr-1" />
      {multiple ? "Apply all" : "Apply"}
    </Button>
  );
}
