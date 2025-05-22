import { FlexMessage, FlexBubble, FlexCarousel } from "@line/bot-sdk";

export function buildFlexMessage(
  altText: string,
  contents: FlexBubble | FlexCarousel
): FlexMessage {
  return {
    type: 'flex',
    altText,
    contents,
  }
}


export function buildResidentBubble(resident: {
  id: string;
  date: string;
  imageUrl: string;
  name: string;
  summary: string;
  temperature: string;
  bloodPressure: string;
  bloodOxygen: string;
  mood: string;
  food: string;
  sleep: string;
  medicalRecord: string;
  activity: string;
}): FlexBubble {
  return {
    type: 'bubble',
    size: 'mega',
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [
        {
          type: 'text',
          text: resident.date + '・照護紀錄摘要',
          size: 'sm',
          color: '#888888',
        },
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'xs',
          contents: [
            {
              type: 'image',
              url: resident.imageUrl, // 住民頭像
              size: 'xs',
              aspectMode: 'cover',
              aspectRatio: '1:1',
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: resident.name,
                  weight: 'bold',
                  size: 'md'
                },
                {
                  type: 'text',
                  text: resident.summary,
                  size: 'sm',
                  wrap: true,
                  color: '#666666'
                }
              ]
            }
          ]
        },
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'xs',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '🌡️ 體溫',
                  size: 'xs',
                  color: '#888888'
                },
                {
                  type: 'text',
                  text: resident.temperature,
                  weight: 'bold',
                  size: 'md',
                  color: '#D94D4D'
                }
              ]
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '♥️ 血壓',
                  size: 'xs',
                  color: '#888888'
                },
                {
                  type: 'text',
                  text: resident.bloodPressure,
                  weight: 'bold',
                  size: 'md',
                  color: '#D94D4D'
                }
              ]
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '🩸 血氧',
                  size: 'xs',
                  color: '#888888'
                },
                {
                  type: 'text',
                  text: resident.bloodOxygen,
                  weight: 'bold',
                  size: 'md',
                  color: '#D94D4D'
                }
              ]
            }
          ]
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: '😌 情緒狀態 ' + resident.mood,
              size: 'sm',
              color: '#AA1D4E'
            }
          ]
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: '🍽 飲食狀況 ' + resident.food,
              size: 'sm',
              color: '#AA1D4E'
            }
          ]
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: '🌙 睡眠狀況 ' + resident.sleep,
              size: 'sm',
              color: '#AA1D4E'
            }
          ]
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: '🩺 就醫紀錄 ' + resident.medicalRecord,
              size: 'sm',
              color: '#666666'
            }
          ]
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: '🎨 活動紀錄 ' + resident.activity,
              size: 'sm',
              color: '#666666'
            }
          ]
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          style: 'primary',
          color: '#D94D4D',
          action: {
            type: 'uri',
            label: '查看詳細照護數據',
            uri: process.env.BASE_URL + '/resident/' + resident.id
          }
        }
      ]
    }
  }
}



export function buildDiseaseBubble(disease: {
  疾病名稱: string;
  疾病敘述: string;
  疾病科別: string;
  圖片: string;
  衛教網站: string;
}) {
  return {
    type: 'bubble',
    hero: {
      type: 'image',
      url: disease.圖片,
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'box',
          layout: 'baseline',
          contents: [
            {
              type: 'text',
              text: `🏷 ${disease.疾病科別}`,
              size: 'xs',
              color: '#AAAAAA',
              weight: 'bold'
            }
          ]
        },
        {
          type: 'text',
          text: disease.疾病名稱,
          weight: 'bold',
          size: 'lg',
          wrap: true
        },
        {
          type: 'text',
          text: disease.疾病敘述.length > 60
            ? disease.疾病敘述.slice(0, 60) + '...'
            : disease.疾病敘述,
          size: 'sm',
          wrap: true,
          margin: 'md'
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '👉 查看完整說明',
            uri: disease.衛教網站
          },
          style: 'link'
        }
      ]
    }
  };
}
