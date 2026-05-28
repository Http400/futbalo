# UI Component Pattern

Components in `packages/ui` wrap MUI components with typed props extensions.

## Component Structure

```ts
// packages/ui/src/components/ComponentName/ComponentName.tsx
import { MuiComponent, type MuiComponentProps } from '@mui/material';

export interface ComponentNameProps extends MuiComponentProps {
  label: string; // or other required additions
}

export function ComponentName({ label, ...props }: ComponentNameProps) {
  return <MuiComponent {...props}>{label}</MuiComponent>;
}
```

```ts
// packages/ui/src/components/ComponentName/index.ts
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';
```

## Rules

- Always use named exports (no default exports in `packages/ui`)
- Each component gets its own folder: `components/ComponentName/`
- Extend MUI prop types — don't redefine them
- Export both component AND props type from `index.ts`

## Storybook Stories

Every component needs a stories file:

```ts
// ComponentName.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'UI/ComponentName',
  component: ComponentName,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  // argTypes for interactive controls
};
export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Primary: Story = { args: { ... } };
```

- `tags: ['autodocs']` is required on all stories
- `title` format: `'UI/ComponentName'`
- Export at least a `Primary` story
