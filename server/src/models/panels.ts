export const PANEL_TYPES = ['agenda', 'tasks', 'inbox', 'people', 'settings'] as const;

export type PanelType = (typeof PANEL_TYPES)[number];