import type { Meta, StoryObj } from '@storybook/react'
import { Globe } from './index'
import type { GlobePoint } from './index'

const CITIES: GlobePoint[] = [
  { id: 'london', label: 'London', lat: 51.5, lng: -0.12 },
  { id: 'tokyo', label: 'Tokyo', lat: 35.68, lng: 139.69 },
  { id: 'new-york', label: 'New York', lat: 40.71, lng: -74.0 },
  { id: 'sydney', label: 'Sydney', lat: -33.87, lng: 151.21 },
  { id: 'cairo', label: 'Cairo', lat: 30.04, lng: 31.24 },
]

const meta: Meta<typeof Globe> = {
  title: 'UI/Globe',
  component: Globe,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    autoRotate: { control: 'boolean' },
    rotationSpeed: { control: { type: 'range', min: 0, max: 0.005, step: 0.0001 } },
    fadeSpeed: { control: { type: 'range', min: 0, max: 2, step: 0.05 } },
    width: { control: 'number' },
    height: { control: 'number' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Globe>

export const Default: Story = {
  args: {
    autoRotate: true,
    rotationSpeed: 0.0005,
  },
}

export const WithPoints: Story = {
  args: {
    autoRotate: true,
    points: CITIES,
  },
}

export const WithFocusPoint: Story = {
  args: {
    autoRotate: false,
    initialView: { lat: 35.68, lng: 139.69 },
    points: CITIES,
    focusPoint: CITIES[0] as GlobePoint,
  },
}

export const NoAutoRotate: Story = {
  args: {
    autoRotate: false,
    points: CITIES,
  },
}

export const FixedSize: Story = {
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100vh', background: '#0a0a0a' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    width: 400,
    height: 400,
    autoRotate: true,
    points: CITIES,
  },
}
