import { LanguageId, LANGUAGES } from "../models/languages";

type Props = {
  languageId: LanguageId;
  onChange: (languageId: LanguageId) => void;
};

export function LanguageSelector({ languageId, onChange }: Props) {
  return (
    <select
      value={languageId}
      onChange={(e) => onChange(e.target.value as LanguageId)}
    >
      {Object.entries(LANGUAGES).map(([id, { displayName }]) => (
        <option value={id}>{displayName}</option>
      ))}
    </select>
  );
}
