import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import styles from '@sambego/storybook-styles'
import PriceField from '.'
const stories = storiesOf('Marketplace/PriceField', module)
    .addDecorator(
        styles({
            color: '#323232',
            padding: '5rem',
            background: '#F8F8F8',
        }),
    )
stories.add('basic', () => (
    <PriceField pricingTokenAddress="pricingTokenAddress" placeholder="Price" onCommit={action('commit')} chainId={1} />
))
stories.add('disabled', () => (
    <PriceField
        pricingTokenAddress="pricingTokenAddress"
        placeholder="Price"
        onCommit={action('commit')}
        chainId={1}
        disabled
    />
))
stories.add('with error', () => (
    <PriceField
        pricingTokenAddress="pricingTokenAddress"
        placeholder="Price"
        error="Something went wrong"
        onCommit={action('commit')}
        chainId={1}
    />
))
