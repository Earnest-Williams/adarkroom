export interface TabSpec {
  id: string;
  titleKey: string;
  mount: () => JSX.Element;
  icon?: string;
}

const TAB_REGISTRY: TabSpec[] = [];

export function registerTab(tab: TabSpec): void {
  if (TAB_REGISTRY.some((existing) => existing.id === tab.id)) {
    throw new Error(`Tab with id '${tab.id}' is already registered.`);
  }
  TAB_REGISTRY.push(tab);
}

export function getRegisteredTabs(): readonly TabSpec[] {
  return TAB_REGISTRY.slice();
}

export function clearTabs(): void {
  TAB_REGISTRY.length = 0;
}
