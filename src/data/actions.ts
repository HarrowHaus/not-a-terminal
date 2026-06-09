import type { ActionEntry } from '../engine/search/types'

export const actions: ActionEntry[] = [
  // --- Color swaps ---
  {
    id: 'color-blue',
    description: 'Change the primary color to blue',
    actionType: 'swap-color',
    intent: { type: 'swap-color', from: '.*', to: 'blue' },
  },
  {
    id: 'color-red',
    description: 'Change the primary color to red',
    actionType: 'swap-color',
    intent: { type: 'swap-color', from: '.*', to: 'red' },
  },
  {
    id: 'color-green',
    description: 'Change the primary color to green',
    actionType: 'swap-color',
    intent: { type: 'swap-color', from: '.*', to: 'green' },
  },
  {
    id: 'color-purple',
    description: 'Change the primary color to purple or violet',
    actionType: 'swap-color',
    intent: { type: 'swap-color', from: '.*', to: 'purple' },
  },
  {
    id: 'color-amber',
    description: 'Change the primary color to amber or orange',
    actionType: 'swap-color',
    intent: { type: 'swap-color', from: '.*', to: 'amber' },
  },

  // --- Dark mode ---
  {
    id: 'dark-mode-on',
    description: 'Enable dark mode with dark backgrounds and light text',
    actionType: 'dark-mode',
    intent: { type: 'dark-mode', enable: true },
  },
  {
    id: 'dark-mode-off',
    description: 'Switch to light mode with white backgrounds',
    actionType: 'dark-mode',
    intent: { type: 'dark-mode', enable: false },
  },

  // --- Layout changes ---
  {
    id: 'layout-center',
    description: 'Center align all the content on the page',
    actionType: 'change-layout',
    intent: { type: 'change-layout', target: 'section', add: ['text-center', 'mx-auto'] },
  },
  {
    id: 'layout-full-width',
    description: 'Make the layout full width without max-width constraints',
    actionType: 'change-layout',
    intent: { type: 'change-layout', target: 'max-w', remove: ['max-w-3xl', 'max-w-4xl', 'max-w-5xl'] },
  },
  {
    id: 'layout-2-cols',
    description: 'Use a two column grid layout',
    actionType: 'change-layout',
    intent: { type: 'change-layout', target: 'grid-cols', add: ['grid-cols-2'], remove: ['grid-cols-3', 'grid-cols-4'] },
  },
  {
    id: 'layout-3-cols',
    description: 'Use a three column grid layout',
    actionType: 'change-layout',
    intent: { type: 'change-layout', target: 'grid-cols', add: ['grid-cols-3'], remove: ['grid-cols-2', 'grid-cols-4'] },
  },
  {
    id: 'layout-bigger-text',
    description: 'Make the body text larger and more readable',
    actionType: 'change-layout',
    intent: { type: 'change-layout', target: 'text', add: ['text-lg'], remove: ['text-sm', 'text-xs'] },
  },
  {
    id: 'layout-smaller-text',
    description: 'Make the body text smaller and more compact',
    actionType: 'change-layout',
    intent: { type: 'change-layout', target: 'text', add: ['text-sm'], remove: ['text-lg', 'text-xl'] },
  },
  {
    id: 'layout-rounded',
    description: 'Add more rounded corners to cards and buttons',
    actionType: 'change-layout',
    intent: { type: 'change-layout', target: 'rounded', add: ['rounded-2xl'], remove: ['rounded-lg', 'rounded-xl'] },
  },
  {
    id: 'layout-shadow',
    description: 'Add drop shadows to cards and containers',
    actionType: 'change-layout',
    intent: { type: 'change-layout', target: 'shadow', add: ['shadow-lg'] },
  },
  {
    id: 'layout-no-shadow',
    description: 'Remove all shadows for a flat design look',
    actionType: 'change-layout',
    intent: { type: 'change-layout', target: 'shadow', remove: ['shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl'] },
  },
  {
    id: 'layout-more-padding',
    description: 'Add more padding and white space between sections',
    actionType: 'change-layout',
    intent: { type: 'change-layout', target: 'py', add: ['py-20'], remove: ['py-8', 'py-12', 'py-16'] },
  },

  // --- Section operations ---
  {
    id: 'remove-features',
    description: 'Remove the features section from the page',
    actionType: 'remove-section',
    intent: { type: 'remove-section', key: 'features' },
  },
  {
    id: 'remove-pricing',
    description: 'Remove the pricing section from the page',
    actionType: 'remove-section',
    intent: { type: 'remove-section', key: 'pricing' },
  },
  {
    id: 'remove-testimonials',
    description: 'Remove the testimonials section from the page',
    actionType: 'remove-section',
    intent: { type: 'remove-section', key: 'testimonials' },
  },
]
