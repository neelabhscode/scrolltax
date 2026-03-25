import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getOpportunityCost(mins: number) {
  if (mins < 30) return "A focused power nap";
  if (mins < 60) return "One solid gym session";
  if (mins < 120) return "A feature-length film";
  return "A deep, meaningful hobby";
}

export function getAppCategory(appName: string): 'Social' | 'Productivity' | 'Entertainment' | 'Other' {
  const lower = appName.toLowerCase();
  if (lower.match(/instagram|tiktok|snapchat|facebook|x|twitter|reddit|threads|bereal|discord|whatsapp|telegram/)) return 'Social';
  if (lower.match(/mail|calendar|notes|notion|slack|teams|messages|safari|chrome|docs|sheets|drive|maps/)) return 'Productivity';
  if (lower.match(/youtube|netflix|spotify|hulu|disney|games|roblox|minecraft|candy crush|twitch|prime/)) return 'Entertainment';
  return 'Other';
}

export function generateReceiptLines(data: {app: string, mins: number}[]) {
  return data.map(item => {
    const category = getAppCategory(item.app);
    
    // Base calculations
    const thumbMiles = (item.mins * 0.004).toFixed(3);
    const dopamineUnits = Math.floor(item.mins * 15);
    const attentionDecay = (item.mins * 0.5).toFixed(1);

    let lines = [];

    switch (category) {
      case 'Social':
        lines = [
          { label: "Endless Scroll Distance", value: thumbMiles, unit: "mi" },
          { label: "Validation Hits", value: dopamineUnits, unit: "units" },
          { label: "Brain Fog Level", value: attentionDecay, unit: "%" }
        ];
        break;
      case 'Productivity':
        lines = [
          { label: "Spreadsheet Sprints", value: thumbMiles, unit: "mi" },
          { label: "Inbox Zero Highs", value: dopamineUnits, unit: "units" },
          { label: "Burnout Velocity", value: attentionDecay, unit: "%" }
        ];
        break;
      case 'Entertainment':
        lines = [
          { label: "Couch Potato Miles", value: thumbMiles, unit: "mi" },
          { label: "Binge-Watch Euphoria", value: dopamineUnits, unit: "units" },
          { label: "Plot-Hole Blindness", value: attentionDecay, unit: "%" }
        ];
        break;
      default:
        lines = [
          { label: "Thumb Miles", value: thumbMiles, unit: "mi" },
          { label: "Dopamine Units", value: dopamineUnits, unit: "units" },
          { label: "Attention Decay", value: attentionDecay, unit: "%" }
        ];
        break;
    }

    return {
      app: item.app,
      mins: item.mins,
      category,
      lines
    };
  });
}

export function formatTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
