const values = [
  {
    key: 'web',
    label: 'Web',
  },
  {
    key: 'sms',
    label: 'Mobile (SMS)',
  },
];


const list2 = {
  label : 'val'
};

function test() {
  return (
    <div>

      <ButtonDropdown
        type="tertiary"
        menu={{
          isFluid: false,
          menuDisabled: false,
          options: {list2},
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
