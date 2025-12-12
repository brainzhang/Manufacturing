module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'variants',
          'responsive',
          'screen',
          // Add these missing Tailwind directives
          '@tailwind',
          '@apply',
          '@variants',
          '@responsive',
          '@screen'
        ],
      },
    ],
    'declaration-block-trailing-semicolon': null,
    'no-descending-specificity': null,
    'selector-class-pattern': null,
    'color-function-notation': 'legacy',
    'alpha-value-notation': 'number',
    'font-family-name-quotes': 'always-where-required',
    'comment-empty-line-before': null,
    'declaration-empty-line-before': null
  },
};