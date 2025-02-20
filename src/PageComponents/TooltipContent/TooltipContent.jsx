import React from "react";

import styles from "./TooltipContent.module.css";
function TooltipContent({ content }) {
  return (
    <div className={styles.tooltipContent} dangerouslySetInnerHTML={{__html : content}}>
        {/* <h1>
            {content}
        </h1> */}
    </div>
  );
}

export default TooltipContent;
