const name = [
  {
    key: '1',
    label: "Option one"
  },
  {
    key: '2',
    label: "Option two"
  },
  {
    key: '3',
    label: "three"
  }
];

<Menu
  onSelect={function noRefCheck(){}}
  onTabOut={function noRefCheck(){}}
  options={name}
  selectedKeys={[
    '2'
  ]}
  size="medium"
/>