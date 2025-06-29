

export const getRandomWarmColorGroup = () => {
    const warmColorGroups: string[][] = [
        ["#FF5733", "#FF8C00", "#FFB347", "#FFD700"], // 橙红、深橙、浅橙、金黄
        ["#FF6B6B", "#FF8A80", "#FFA07A", "#FFB6C1"], // 番茄红、鲑鱼红、浅珊瑚红、浅粉红
        ["#FF7F50", "#FFA500", "#FFC125", "#FFD700"], // 珊瑚色、橙色、金菊黄、金色
        ["#E9967A", "#F08080", "#FA8072", "#FF7F50"], // 深肉色、浅珊瑚红、鲑鱼红、珊瑚色
        ["#FF4500", "#FF6347", "#FF7F50", "#FFA07A"], // 橙红色、番茄红、珊瑚色、浅珊瑚色
        ["#DC143C", "#FF4500", "#FF6347", "#FF7F50"], // 深红、橙红色、番茄红、珊瑚色
    ];
    const randomIndex = Math.floor(Math.random() * warmColorGroups.length);
    return warmColorGroups[randomIndex];
};