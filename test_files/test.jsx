import { useTransition } from "src/hooks/i18n";
const values = [
  {
    key: 'web',
    label: useTransition("WEB", "Web"),
  },
  {
    key: 'sms',
    label: useTransition("MOBILE_(SMS)", "Mobile (SMS)"),
  },
];

const lab = {
  label: "value"

}

{/* <> { } </> */}

const list2 = [ {
  label : 'val'
}]

function test() {
  return (
    <div>
      <ButtonDropdown
        type="tertiary"
        menu={{
          isFluid: false,
          menuDisabled: false,
          options: {values},
          size: 'medium',
        }}
        onOptionSelect={(option) => onPreview(option.key)}
        size="medium"
        disabled={previewDisabled}
      >{useTransition("PREVIEW_BOT", "Preview Bot")}</ButtonDropdown>
    </div>
  )
}

export default test
