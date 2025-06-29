use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Clone, Serialize, Default)]
pub struct Element {
    pub elements_key: String,
    pub elements_code: u32,
}

#[derive(Debug, Deserialize, Clone, Serialize, Default)]
pub struct Skill {
    pub skill_code: u32,
}

#[derive(Debug, Deserialize, Clone, Serialize, Default)]
pub struct TimeOrNama {
    pub id: String, // 元素id
    pub t: u32,     // 1: 延迟 2: 等待技能释放 3: 内力判断
    pub n: u32,     // 延迟时间或技能编号
}

#[derive(Debug, Deserialize, Clone, Serialize, Default)]
pub struct Color {
    pub coordinate: String, // 鼠标坐标
    pub rgb: String,        // rgb值
}

#[derive(Debug, Deserialize, Clone, Serialize)]
#[serde(untagged)]
pub enum ElementEnum {
    Element(Element),
    Skill(Skill),
    TimeOrNama(TimeOrNama),
    Color(Color),
}

impl Default for ElementEnum {
    fn default() -> Self {
        ElementEnum::Element(Element::default())
    }
}

#[derive(Debug, Deserialize, Clone, Serialize, Default)]
pub struct Children {
    pub element: ElementEnum, // 元素
    pub iyn: String,
    pub children: Option<Vec<Children>>, // 子元素
}

#[derive(Debug, Deserialize, Clone, Serialize, Default)]
pub struct Elements {
    // pub woke_type: u32,  // 操作方式 1: 长按 2: 单击
    pub header: Element, // 操作第一个元素
    pub children: Option<Vec<Children>>,
}
