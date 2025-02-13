export const publisherCityMap = {
    "法律": "北京",
    "中国政法大学": "北京",
    "北京大学": "北京",
    "清华大学": "北京",
    "中国人民大学": "北京",
    "社会科学文献": "北京",
    "商务印书馆": "北京",
    "中信": "北京",
    "人民": "北京",
    "复旦大学": "上海",
    "上海人民": "上海",
    "上海三联书店": "上海",
    "格致": "上海",
    "浙江大学": "杭州",
    "武汉大学": "武汉",
    "南京大学": "南京",
    "江苏人民": "南京",
    "广东人民": "广州",
    "四川人民": "成都",
    "重庆大学": "重庆"
};

export const getPublisherCity = (publisher) => {
    for (const key in publisherCityMap) {
        if (publisher.includes(key)) {
            return publisherCityMap[key];
        }
    }
    return null;
}; 