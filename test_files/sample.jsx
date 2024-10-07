
import { useTransition } from "src/hooks/i18n";
<Menu
  onSelect={function noRefCheck(){}}
  onTabOut={function noRefCheck(){}}
  options={[
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
      label: useTransition("OPTION_THREE", "Option three")
    }
  ]}
  selectedKeys={[
    '2'
  ]}
  size="medium"
/>