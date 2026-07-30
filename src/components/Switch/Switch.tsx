import React, { useState } from "react";
import "./switch.scss";

type SwitchProps = {
  switchAction: () => void;
  states: string[];
};

function Switch({ switchAction, states }: SwitchProps) {
  const [active, setActive] = useState<boolean>(false);

  const handleChange = () => {
    setActive(!active);
    switchAction();
  };

  return (
    <div className="container">
      <p>{states[0]}</p>
      <label className="switch">
        <input
          className="togglesw"
          type="checkbox"
          checked={active}
          onChange={handleChange}
        />
        <div className="indicator left"></div>
        <div className="indicator right"></div>
        <div className="button"></div>
      </label>
      <p>{states[1]}</p>
    </div>
  );
}

export default Switch;
