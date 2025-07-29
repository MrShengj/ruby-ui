import { Shape } from "@antv/x6";

export const createElementComponents = (elements: any[], portsConfig: any) => {
  return elements.map((element) => {
    const isSpecialType =
      element.elements_code === 4 || element.elements_code === 5;
    const labelColor = isSpecialType ? "#003a8c" : "#1890ff";
    const ports = isSpecialType ? portsConfig.singleY : portsConfig.delay;

    return new Shape.Rect({
      width: 80,
      height: 36,
      attrs: {
        body: { fill: "#fffbe6", stroke: labelColor, rx: 8, ry: 8 },
        label: {
          text: element.elements_key || "按键",
          fill: labelColor,
          fontSize: 14,
        },
      },
      ports,
      data: {
        elements_code: element.elements_code,
        elements_key: element.elements_key,
        key_up_delay: 0,
      },
    });
  });
};

export const createSkillComponents = (skills: any[], portsConfig: any) => {
  return skills.map(
    (skill) =>
      new Shape.Rect({
        width: 80,
        height: 36,
        attrs: {
          body: { fill: "#e6fffb", stroke: "#13c2c2", rx: 8, ry: 8 },
          label: {
            text: skill.skill_name || "技能",
            fill: "#13c2c2",
            fontSize: 14,
          },
        },
        ports: portsConfig.normal,
        data: {
          skill_name: skill.skill_name,
          skill_code: skill.skill_code,
          skill_type: skill.skill_type,
          skill_offset: skill.skill_offset,
        },
      })
  );
};

export const createColorComponents = (rgbs: any[], portsConfig: any) => {
  const components = [
    new Shape.Rect({
      width: 80,
      height: 36,
      attrs: {
        body: { fill: "#f0f5ff", stroke: "#2f54eb", rx: 8, ry: 8 },
        label: { text: "取色", fill: "#2f54eb", fontSize: 14 },
      },
      ports: portsConfig.normal,
    }),
  ];

  rgbs.forEach((color) => {
    const rgb = color.rgb.split(",").map(Number);
    const hex = `#${rgb.map((x) => x.toString(16).padStart(2, "0")).join("")}`;

    components.push(
      new Shape.Rect({
        width: 80,
        height: 36,
        attrs: {
          body: { fill: hex, stroke: "#2f54eb", rx: 8, ry: 8 },
          label: { text: color.name, fill: "#2f54eb", fontSize: 14 },
        },
        ports: portsConfig.normal,
        data: {
          id: color.id,
          coordinate: color.coordinate,
          rgb: color.rgb,
        },
      })
    );
  });

  return components;
};

export const createTimeWaitComponents = (portsConfig: any) => {
  return [
    new Shape.Rect({
      width: 80,
      height: 36,
      attrs: {
        body: { fill: "#fff1f0", stroke: "#ff4d4f", rx: 8, ry: 8 },
        label: { text: "延迟", fill: "#ff4d4f", fontSize: 14 },
      },
      ports: portsConfig.delay,
    }),
    new Shape.Rect({
      width: 80,
      height: 36,
      attrs: {
        body: { fill: "#fff1f0", stroke: "#ff4d4f", rx: 8, ry: 8 },
        label: { text: "定时", fill: "#ff4d4f", fontSize: 14 },
      },
      ports: portsConfig.normal,
    }),
    new Shape.Rect({
      width: 80,
      height: 36,
      attrs: {
        body: { fill: "#f6ffed", stroke: "#52c41a", rx: 8, ry: 8 },
        label: { text: "重置定时", fill: "#52c41a", fontSize: 14 },
      },
      ports: portsConfig.delay,
    }),
    new Shape.Rect({
      width: 80,
      height: 36,
      attrs: {
        body: { fill: "#fff1f0", stroke: "#00a2c2", rx: 8, ry: 8 },
        label: { text: "内力", fill: "#00a2c2", fontSize: 14 },
      },
      ports: portsConfig.normal,
    }),
  ];
};
