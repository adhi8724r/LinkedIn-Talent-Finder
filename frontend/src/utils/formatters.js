/**
 * Shared String & Name Formatting Utilities
 */

export const formatDisplayName = (name) => {
  if (!name) return "Candidate";
  return name.replace(/^(Resume|RESUME|CV|Dice_Profile_|Dice_Resume_CV_)[\s_-]*/i, "")
             .replace(/\s+20\d\d.*$/i, "")
             .replace(/[+_]/g, " ")
             .trim();
};

