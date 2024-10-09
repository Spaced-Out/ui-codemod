import React from 'react'

import { useI18n } from "src/hooks/useI18n";

function test2() {

    const temp = '@Invalid 12 @ @ You';
    const tempi = 'Invalid @You';
    const val = '@@@'
    
    // const val = `${t("APPLE", 'apple')}   ${"BANANA_ARES", "banana ares"})}`

    // const val = `${t("APPLE___BANANA_ARES", "apple   banana ares")}`


    const toolTipText = 'These numbers are invalid and cannot receive message.';

    const val1 =  `my name ${val} is`


    // const val1 = `${`{${t("VALUE_IS__THIS_TYPE", "value is @ this type")} }`}`
   
    // Invalid (
    // (Invalid 
    // (Invalid)



    // const val1 = `${t('VALUE_IS', 'value_is')} ${val}`

    // const temp = `@${t("INVALID", "Invalid")} @ ${t("ROOPAK", "Roopak")}  ) ${val})`;
    // const val = ` ${t("APPLE", "apple")} @@${t("BANANA", "bana/na")}`

    // const val1 = `invalid ${val} ) )`

    // const temp = `${t("INVALID", "Invalid")} @ ${t("ROOPAK", "Roopak")}`;
    // const val = ` ${t("APPLE", "apple")}`
    

    // const val1 = ` ${t("INVALID", "invalid")}${val} ) )`

    //  `(${t("INVALID", "invalid")} ${val})`

    // const temp = `(${t('INVALID', 'Invalid')} ${t('ROOPAK', '@Roopak')})`
    // `(${t('INVALID', 'Invalid')} @ ${t('ROOPAK', 'Roopak')} ${val} )`
    // `(${t('INVALID', 'Invalid')} @ ${t('ROOPAK', 'Roopak')} ${val} )`
  return (
    <div>
     {temp} 
     {/* {val} */}
     {tempi}
     {toolTipText}
     {val1}
    </div>
  )
}

export default test2
