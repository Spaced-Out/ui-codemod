import { useTransition } from "src/hooks/i18n";
const name = [
  {
    key: '1',
    label: useTransition("OPTION_ONE", "Option one")
  },
  {
    key: '2',
    label: useTransition("OPTION_TWO", "Option two")
  },
  {
    key: '3',
    label: useTransition("THREE", "three")
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