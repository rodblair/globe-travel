module.exports = [
"[project]/hooks/useChat.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useChat",
    ()=>useChat
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$react$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@ai-sdk/react/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/ai/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
;
function isClarifyingQuestion(text) {
    const normalized = text.trim();
    if (!normalized) return false;
    return normalized.includes('?') || /\b(tell me|what city|which city|how many days|what dates|do you have|could you|would you|please share|let me know|what's the|what is the)\b/i.test(normalized);
}
function useChat(options) {
    const optionsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(options);
    const seenToolCallsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new Set());
    const hadPlanActivityRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        optionsRef.current = options;
    }, [
        options
    ]);
    const { messages: aiMessages, status, error: aiError, sendMessage: aiSendMessage, stop, setMessages: setAIMessages } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$react$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useChat"])({
        transport: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DefaultChatTransport"]({
            api: '/api/chat',
            body: {
                type: options.type,
                conversationId: options.conversationId,
                tripId: options.tripId
            }
        })
    });
    const parseToolOutput = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((output)=>{
        if (typeof output === 'string') {
            try {
                return JSON.parse(output);
            } catch  {
                return null;
            }
        }
        if (output && typeof output === 'object') {
            return output;
        }
        return null;
    }, []);
    // Watch for tool call results in messages and fire events
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        for (const msg of aiMessages){
            if (msg.role !== 'assistant') continue;
            for (const part of msg.parts){
                if (part.type.startsWith('tool-') && 'state' in part && part.state === 'output-available' && 'toolCallId' in part) {
                    const toolCallId = part.toolCallId;
                    if (seenToolCallsRef.current.has(toolCallId)) continue;
                    seenToolCallsRef.current.add(toolCallId);
                    const output = part.output;
                    const parsed = parseToolOutput(output);
                    if (!parsed) continue;
                    if (optionsRef.current.type === 'plan') {
                        hadPlanActivityRef.current = true;
                    }
                    if (parsed?.kind === 'trip_patch' && parsed.tripId && optionsRef.current.onTripPatch) {
                        optionsRef.current.onTripPatch(parsed.tripId);
                    }
                    if (parsed?.kind === 'navigate' && optionsRef.current.onNavigate) {
                        optionsRef.current.onNavigate({
                            latitude: parsed.latitude || 0,
                            longitude: parsed.longitude || 0,
                            name: parsed.name,
                            country: parsed.country,
                            description: parsed.description,
                            highlights: parsed.highlights,
                            best_time: parsed.best_time
                        });
                    }
                    // Back-compat: place add / navigate events used by onboarding/explore.
                    if (parsed.success && parsed.name && optionsRef.current.onPlaceAdded) {
                        if (parsed.action === 'navigate') {
                            optionsRef.current.onPlaceAdded({
                                type: 'place_added',
                                place: {
                                    name: parsed.name,
                                    country: parsed.country || '',
                                    latitude: parsed.latitude || 0,
                                    longitude: parsed.longitude || 0,
                                    status: 'visited',
                                    description: parsed.description,
                                    highlights: parsed.highlights,
                                    best_time: parsed.best_time
                                }
                            });
                        } else {
                            optionsRef.current.onPlaceAdded({
                                type: 'place_added',
                                place: {
                                    name: parsed.name,
                                    country: parsed.country || '',
                                    latitude: parsed.latitude || 0,
                                    longitude: parsed.longitude || 0,
                                    status: parsed.status === 'bucket_list' ? 'bucket_list' : 'visited'
                                }
                            });
                        }
                    }
                }
            }
        }
    }, [
        aiMessages,
        parseToolOutput
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (status === 'ready' && optionsRef.current.type === 'plan' && optionsRef.current.tripId && optionsRef.current.onTripPatch && hadPlanActivityRef.current) {
            hadPlanActivityRef.current = false;
            optionsRef.current.onTripPatch(optionsRef.current.tripId);
        }
    }, [
        status
    ]);
    const isLoading = status === 'streaming' || status === 'submitted';
    const error = aiError ? aiError.message || 'Something went wrong. Please try again.' : null;
    // Convert AI SDK UIMessages to our simple Message format
    const messages = aiMessages.map((m)=>{
        const textContent = m.parts?.filter((p)=>p.type === 'text').map((p)=>p.text).join('') || '';
        const hasSuccessfulTripPatch = options.type === 'plan' && m.role === 'assistant' && m.parts?.some((part)=>{
            if (!part.type.startsWith('tool-') || !('state' in part) || part.state !== 'output-available') {
                return false;
            }
            const output = part.output;
            const parsed = parseToolOutput(output);
            return parsed?.kind === 'trip_patch';
        }) === true;
        const shouldCollapseAssistantCopy = hasSuccessfulTripPatch && m.role === 'assistant' && !isClarifyingQuestion(textContent);
        return {
            id: m.id,
            role: m.role,
            content: shouldCollapseAssistantCopy ? '' : textContent
        };
    }).filter((m)=>m.content.length > 0 || m.role === 'user');
    const sendMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (content)=>{
        if (optionsRef.current.type === 'plan') {
            hadPlanActivityRef.current = true;
        }
        aiSendMessage({
            text: content
        });
    }, [
        aiSendMessage
    ]);
    const setMessages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((msgs)=>{
        setAIMessages(msgs.map((m)=>({
                id: m.id,
                role: m.role,
                parts: [
                    {
                        type: 'text',
                        text: m.content
                    }
                ]
            })));
    }, [
        setAIMessages
    ]);
    return {
        messages,
        isLoading,
        error,
        sendMessage,
        stop,
        setMessages
    };
}
}),
"[project]/components/chat/ChatMessage.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ChatMessage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
'use client';
;
;
function renderContent(content) {
    // Simple markdown-like rendering
    const lines = content.split('\n');
    const elements = [];
    lines.forEach((line, i)=>{
        let processed = line;
        // Bold
        if (line.includes('**')) {
            const parts = line.split(/\*\*(.*?)\*\*/g);
            processed = parts.map((part, j)=>j % 2 === 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                    className: "font-semibold text-white",
                    children: part
                }, j, false, {
                    fileName: "[project]/components/chat/ChatMessage.tsx",
                    lineNumber: 19,
                    columnNumber: 11
                }, this) : part);
        }
        // Italic
        if (typeof processed === 'string' && processed.includes('*')) {
            const parts = processed.split(/\*(.*?)\*/g);
            processed = parts.map((part, j)=>j % 2 === 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                    className: "italic",
                    children: part
                }, j, false, {
                    fileName: "[project]/components/chat/ChatMessage.tsx",
                    lineNumber: 33,
                    columnNumber: 11
                }, this) : part);
        }
        // Bullet lists
        if (line.startsWith('- ') || line.startsWith('* ')) {
            elements.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                className: "ml-4 list-disc",
                children: typeof processed === 'string' ? processed.slice(2) : processed
            }, i, false, {
                fileName: "[project]/components/chat/ChatMessage.tsx",
                lineNumber: 45,
                columnNumber: 9
            }, this));
            return;
        }
        // Numbered lists
        const numberedMatch = line.match(/^(\d+)\.\s(.*)/);
        if (numberedMatch) {
            elements.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                className: "ml-4 list-decimal",
                children: numberedMatch[2]
            }, i, false, {
                fileName: "[project]/components/chat/ChatMessage.tsx",
                lineNumber: 56,
                columnNumber: 9
            }, this));
            return;
        }
        // Empty line = paragraph break
        if (line.trim() === '') {
            elements.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, i, false, {
                fileName: "[project]/components/chat/ChatMessage.tsx",
                lineNumber: 65,
                columnNumber: 21
            }, this));
            return;
        }
        elements.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            children: [
                processed,
                i < lines.length - 1 && lines[i + 1]?.trim() !== '' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                    fileName: "[project]/components/chat/ChatMessage.tsx",
                    lineNumber: 72,
                    columnNumber: 65
                }, this)
            ]
        }, i, true, {
            fileName: "[project]/components/chat/ChatMessage.tsx",
            lineNumber: 70,
            columnNumber: 7
        }, this));
    });
    return elements;
}
function ChatMessage({ message, index }) {
    const isUser = message.role === 'user';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
        initial: {
            opacity: 0,
            y: 12
        },
        animate: {
            opacity: 1,
            y: 0
        },
        transition: {
            duration: 0.3,
            delay: index * 0.05
        },
        className: `flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`,
        children: [
            !isUser && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-shrink-0 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-sm",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    role: "img",
                    "aria-label": "globe",
                    children: '\uD83C\uDF0D'
                }, void 0, false, {
                    fileName: "[project]/components/chat/ChatMessage.tsx",
                    lineNumber: 92,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/chat/ChatMessage.tsx",
                lineNumber: 91,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? 'bg-amber-500/20 backdrop-blur-sm border border-amber-500/20 text-amber-50' : 'bg-white/10 backdrop-blur-sm border border-white/10 text-white/90'}`,
                children: message.content ? renderContent(message.content) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-white/40",
                    children: "..."
                }, void 0, false, {
                    fileName: "[project]/components/chat/ChatMessage.tsx",
                    lineNumber: 106,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/chat/ChatMessage.tsx",
                lineNumber: 98,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/chat/ChatMessage.tsx",
        lineNumber: 84,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/chat/TypingIndicator.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TypingIndicator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
'use client';
;
;
function TypingIndicator() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex gap-3 justify-start",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-shrink-0 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-sm",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    role: "img",
                    "aria-label": "globe",
                    children: '\uD83C\uDF0D'
                }, void 0, false, {
                    fileName: "[project]/components/chat/TypingIndicator.tsx",
                    lineNumber: 9,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/chat/TypingIndicator.tsx",
                lineNumber: 8,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-1.5",
                children: [
                    0,
                    1,
                    2
                ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                        className: "w-2 h-2 rounded-full bg-white/40",
                        animate: {
                            opacity: [
                                0.3,
                                1,
                                0.3
                            ],
                            scale: [
                                0.8,
                                1,
                                0.8
                            ]
                        },
                        transition: {
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: 'easeInOut'
                        }
                    }, i, false, {
                        fileName: "[project]/components/chat/TypingIndicator.tsx",
                        lineNumber: 16,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/components/chat/TypingIndicator.tsx",
                lineNumber: 14,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/chat/TypingIndicator.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/chat/ChatInterface.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ChatInterface
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/send.js [app-ssr] (ecmascript) <export default as Send>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/square.js [app-ssr] (ecmascript) <export default as Square>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$chat$2f$ChatMessage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/chat/ChatMessage.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$chat$2f$TypingIndicator$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/chat/TypingIndicator.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
function ChatInterface({ messages, isLoading, error, onSendMessage, onStop, placeholder = 'Type your message...', suggestions = [], storageKey: _storageKey }) {
    void _storageKey;
    const [input, setInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Auto-scroll to bottom on new messages
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth'
        });
    }, [
        messages
    ]);
    const handleSend = ()=>{
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;
        onSendMessage(trimmed);
        setInput('');
        // Reset textarea height
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }
    };
    const handleKeyDown = (e)=>{
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    const handleInputChange = (e)=>{
        setInput(e.target.value);
        // Auto-resize textarea
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    };
    // Show typing indicator when loading and last message is assistant with empty content
    const showTyping = isLoading && (messages.length === 0 || messages[messages.length - 1]?.content === '');
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col h-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto px-4 py-6 space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                        mode: "popLayout",
                        children: messages.filter((m)=>m.content || m.role === 'user').map((message, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$chat$2f$ChatMessage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                message: message,
                                index: index
                            }, message.id, false, {
                                fileName: "[project]/components/chat/ChatInterface.tsx",
                                lineNumber: 80,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/components/chat/ChatInterface.tsx",
                        lineNumber: 76,
                        columnNumber: 9
                    }, this),
                    showTyping && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$chat$2f$TypingIndicator$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/components/chat/ChatInterface.tsx",
                        lineNumber: 84,
                        columnNumber: 24
                    }, this),
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/components/chat/ChatInterface.tsx",
                        lineNumber: 87,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: messagesEndRef
                    }, void 0, false, {
                        fileName: "[project]/components/chat/ChatInterface.tsx",
                        lineNumber: 92,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/chat/ChatInterface.tsx",
                lineNumber: 75,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-shrink-0 border-t border-white/10 bg-black/40 backdrop-blur-xl px-4 py-3",
                children: [
                    suggestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "max-w-3xl mx-auto mb-2 flex gap-2 overflow-x-auto pb-1",
                        children: suggestions.slice(0, 6).map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].button, {
                                whileHover: {
                                    scale: 1.02
                                },
                                whileTap: {
                                    scale: 0.98
                                },
                                onClick: ()=>onSendMessage(s),
                                className: "flex-shrink-0 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white/70 hover:bg-white/10 transition-all",
                                children: s
                            }, s, false, {
                                fileName: "[project]/components/chat/ChatInterface.tsx",
                                lineNumber: 100,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/components/chat/ChatInterface.tsx",
                        lineNumber: 98,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-2xl px-3 py-1.5 focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10 transition-all",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                ref: inputRef,
                                value: input,
                                onChange: handleInputChange,
                                onKeyDown: handleKeyDown,
                                placeholder: placeholder,
                                rows: 1,
                                className: "flex-1 resize-none bg-transparent py-2 px-1 text-sm text-white placeholder:text-white/30 focus:outline-none",
                                style: {
                                    maxHeight: '120px'
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/chat/ChatInterface.tsx",
                                lineNumber: 113,
                                columnNumber: 11
                            }, this),
                            isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].button, {
                                whileHover: {
                                    scale: 1.05
                                },
                                whileTap: {
                                    scale: 0.95
                                },
                                onClick: onStop,
                                className: "flex-shrink-0 w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__["Square"], {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "[project]/components/chat/ChatInterface.tsx",
                                    lineNumber: 131,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/chat/ChatInterface.tsx",
                                lineNumber: 125,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].button, {
                                whileHover: {
                                    scale: 1.05
                                },
                                whileTap: {
                                    scale: 0.95
                                },
                                onClick: handleSend,
                                disabled: !input.trim(),
                                className: "flex-shrink-0 w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-black hover:bg-amber-400 transition-colors disabled:opacity-20 disabled:cursor-default disabled:bg-white/10 disabled:text-white/30",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__["Send"], {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "[project]/components/chat/ChatInterface.tsx",
                                    lineNumber: 141,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/chat/ChatInterface.tsx",
                                lineNumber: 134,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/chat/ChatInterface.tsx",
                        lineNumber: 112,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/chat/ChatInterface.tsx",
                lineNumber: 96,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/chat/ChatInterface.tsx",
        lineNumber: 73,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/trips/TripDayMap.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TripDayMap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/mapbox-gl/dist/mapbox-gl.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
function coerceCoordinate(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}
function getStopRole(index, total) {
    if (total <= 1) return 'solo';
    if (index === 0) return 'start';
    if (index === total - 1) return 'finish';
    return 'waypoint';
}
function getRoleColors(role, active) {
    if (role === 'start') {
        return {
            outline: active ? 'rgba(110,231,183,0.92)' : 'rgba(110,231,183,0.82)',
            halo: active ? 'rgba(110,231,183,0.2)' : 'rgba(110,231,183,0.14)',
            fill: active ? 'rgba(110,231,183,1)' : 'rgba(110,231,183,0.95)'
        };
    }
    if (role === 'finish') {
        return {
            outline: active ? 'rgba(251,191,36,0.95)' : 'rgba(251,191,36,0.84)',
            halo: active ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.14)',
            fill: active ? 'rgba(251,191,36,1)' : 'rgba(251,191,36,0.95)'
        };
    }
    return {
        outline: active ? 'rgba(125,211,252,0.92)' : 'rgba(125,211,252,0.82)',
        halo: active ? 'rgba(125,211,252,0.16)' : 'rgba(125,211,252,0.12)',
        fill: active ? 'rgba(125,211,252,0.98)' : 'rgba(125,211,252,0.94)'
    };
}
function buildStopPath(stops) {
    if (stops.length === 0) return null;
    const longitudes = stops.map((stop)=>stop.longitude);
    const latitudes = stops.map((stop)=>stop.latitude);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const lngSpan = Math.max(maxLng - minLng, 0.01);
    const latSpan = Math.max(maxLat - minLat, 0.01);
    const padding = 18;
    const width = 100;
    const height = 100;
    const project = (longitude, latitude)=>{
        const x = padding + (longitude - minLng) / lngSpan * (width - padding * 2);
        const y = height - padding - (latitude - minLat) / latSpan * (height - padding * 2);
        return [
            x,
            y
        ];
    };
    const pointNodes = stops.map((stop)=>{
        const [x, y] = project(stop.longitude, stop.latitude);
        return {
            ...stop,
            x,
            y
        };
    });
    return {
        linePoints: pointNodes.map((point)=>`${point.x},${point.y}`).join(' '),
        pointNodes
    };
}
function TripDayMap({ stops, routeGeojson, title, subtitle, routeSummary, stopPreview = [], interactive = false, mapHeightClassName = 'h-32', showDetails = true, active = false, onClick, className }) {
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const markersRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])([]);
    const [mapReady, setMapReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mapFailed, setMapFailed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const mapboxToken = ("TURBOPACK compile-time value", "pk.eyJ1Ijoid2lsbDA3MDgiLCJhIjoiY21tcno5dXAxMWZmNjJxcTY3NDNvNGZhbSJ9.k-9ORP8DXlW-ljJVHAn08g");
    const shouldRenderInteractive = interactive && Boolean(mapboxToken) && !mapFailed;
    const validStops = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>stops.map((stop)=>{
            const latitude = coerceCoordinate(stop.latitude);
            const longitude = coerceCoordinate(stop.longitude);
            if (latitude == null || longitude == null) return null;
            return {
                ...stop,
                latitude,
                longitude
            };
        }).filter((stop)=>stop !== null), [
        stops
    ]);
    const previewGeometry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const lineFeature = routeGeojson && routeGeojson.type === 'Feature' ? routeGeojson : routeGeojson && routeGeojson.type === 'FeatureCollection' && routeGeojson.features.find((feature)=>feature.geometry?.type === 'LineString') ? routeGeojson.features.find((feature)=>feature.geometry?.type === 'LineString') : null;
        const lineCoordinates = lineFeature?.geometry?.type === 'LineString' ? lineFeature.geometry.coordinates.filter((coordinate)=>coordinate.length >= 2).map((coordinate)=>[
                coordinate[0],
                coordinate[1]
            ]) : validStops.map((stop)=>[
                stop.longitude,
                stop.latitude
            ]);
        const points = validStops.map((stop)=>({
                ...stop,
                longitude: stop.longitude,
                latitude: stop.latitude
            }));
        const allCoordinates = [
            ...lineCoordinates,
            ...points.map((point)=>[
                    point.longitude,
                    point.latitude
                ])
        ];
        if (allCoordinates.length === 0) return null;
        const longitudes = allCoordinates.map(([longitude])=>longitude);
        const latitudes = allCoordinates.map(([, latitude])=>latitude);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const lngSpan = Math.max(maxLng - minLng, 0.01);
        const latSpan = Math.max(maxLat - minLat, 0.01);
        const padding = 24;
        const width = 100;
        const height = 100;
        const project = ([longitude, latitude])=>{
            const x = padding + (longitude - minLng) / lngSpan * (width - padding * 2);
            const y = height - padding - (latitude - minLat) / latSpan * (height - padding * 2);
            return [
                x,
                y
            ];
        };
        return {
            linePoints: lineCoordinates.map(project).map(([x, y])=>`${x},${y}`).join(' '),
            pointNodes: points.map((point)=>{
                const [x, y] = project([
                    point.longitude,
                    point.latitude
                ]);
                return {
                    ...point,
                    x,
                    y
                };
            })
        };
    }, [
        routeGeojson,
        validStops
    ]);
    const stopOnlyPreview = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>buildStopPath(validStops), [
        validStops
    ]);
    const startStop = validStops[0] || null;
    const endStop = validStops.length > 1 ? validStops[validStops.length - 1] : validStops[0] || null;
    const fitMapToStops = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((map)=>{
        if (validStops.length === 0) {
            map.flyTo({
                center: [
                    0,
                    20
                ],
                zoom: 1.15,
                duration: 0
            });
            return;
        }
        const bounds = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].LngLatBounds();
        validStops.forEach((stop)=>bounds.extend([
                stop.longitude,
                stop.latitude
            ]));
        if (validStops.length === 1) {
            map.flyTo({
                center: [
                    validStops[0].longitude,
                    validStops[0].latitude
                ],
                zoom: 10,
                duration: 0
            });
            return;
        }
        map.fitBounds(bounds, {
            padding: interactive ? 56 : 42,
            maxZoom: interactive ? 13 : 11,
            duration: 0
        });
    }, [
        interactive,
        validStops
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!interactive) return;
        if (!containerRef.current) return;
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].accessToken = mapboxToken;
        let map;
        try {
            map = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].Map({
                container: containerRef.current,
                style: 'mapbox://styles/mapbox/navigation-night-v1',
                center: [
                    0,
                    20
                ],
                zoom: 1.25,
                attributionControl: false,
                interactive,
                dragRotate: false,
                touchZoomRotate: interactive ? {
                    around: 'center'
                } : false
            });
        } catch  {
            queueMicrotask(()=>setMapFailed(true));
            return;
        }
        mapRef.current = map;
        if (interactive) {
            map.addControl(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].NavigationControl({
                showCompass: false
            }), 'top-right');
        }
        map.on('error', ()=>{
            setMapFailed(true);
        });
        map.on('load', ()=>{
            setMapReady(true);
            map.addSource('day-route', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });
            map.addSource('day-stops', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });
            map.addLayer({
                id: 'day-route-line',
                type: 'line',
                source: 'day-route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': 'rgba(125,211,252,0.85)',
                    'line-width': 2.75,
                    'line-blur': 0.3
                }
            });
            map.addLayer({
                id: 'day-stop-outline',
                type: 'circle',
                source: 'day-stops',
                paint: {
                    'circle-radius': interactive ? 18 : 12,
                    'circle-color': 'rgba(125,211,252,0.12)',
                    'circle-stroke-width': interactive ? 2 : 1.5,
                    'circle-stroke-color': 'rgba(125,211,252,0.75)'
                }
            });
            map.addLayer({
                id: 'day-stop-fill',
                type: 'circle',
                source: 'day-stops',
                paint: {
                    'circle-radius': interactive ? 6 : 4,
                    'circle-color': 'rgba(125,211,252,0.92)',
                    'circle-stroke-width': 1,
                    'circle-stroke-color': 'rgba(5,5,16,0.9)'
                }
            });
            map.addLayer({
                id: 'day-stop-labels',
                type: 'symbol',
                source: 'day-stops',
                layout: {
                    'text-field': [
                        'get',
                        'title'
                    ],
                    'text-size': interactive ? 11 : 10,
                    'text-offset': [
                        0,
                        1.4
                    ],
                    'text-anchor': 'top',
                    visibility: interactive ? 'visible' : 'none'
                },
                paint: {
                    'text-color': 'rgba(255,255,255,0.82)',
                    'text-halo-color': 'rgba(5,5,16,0.92)',
                    'text-halo-width': 1.1
                }
            });
        });
        return ()=>{
            setMapReady(false);
            markersRef.current.forEach((marker)=>marker.remove());
            markersRef.current = [];
            map.remove();
            mapRef.current = null;
        };
    }, [
        interactive,
        mapboxToken
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const map = mapRef.current;
        if (!map || !mapReady) return;
        const source = map.getSource('day-route');
        if (source) {
            source.setData(routeGeojson || {
                type: 'FeatureCollection',
                features: []
            });
        }
        if (map.getLayer('day-route-line')) {
            map.setPaintProperty('day-route-line', 'line-color', active ? 'rgba(251,191,36,0.95)' : 'rgba(125,211,252,0.85)');
            map.setPaintProperty('day-route-line', 'line-width', active ? 3.5 : 2.75);
        }
    }, [
        routeGeojson,
        active,
        mapReady
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const map = mapRef.current;
        if (!map || !mapReady) return;
        const stopSource = map.getSource('day-stops');
        if (stopSource) {
            stopSource.setData({
                type: 'FeatureCollection',
                features: validStops.map((stop)=>({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [
                                stop.longitude,
                                stop.latitude
                            ]
                        },
                        properties: {
                            id: stop.id,
                            index: stop.index,
                            title: stop.title
                        }
                    }))
            });
        }
        if (map.getLayer('day-stop-outline')) {
            map.setPaintProperty('day-stop-outline', 'circle-color', active ? 'rgba(251,191,36,0.1)' : 'rgba(125,211,252,0.12)');
            map.setPaintProperty('day-stop-outline', 'circle-stroke-color', active ? 'rgba(251,191,36,0.78)' : 'rgba(125,211,252,0.75)');
            map.setPaintProperty('day-stop-outline', 'circle-radius', interactive ? 18 : 12);
        }
        if (map.getLayer('day-stop-fill')) {
            map.setPaintProperty('day-stop-fill', 'circle-color', active ? 'rgba(251,191,36,0.92)' : 'rgba(125,211,252,0.92)');
            map.setPaintProperty('day-stop-fill', 'circle-radius', interactive ? 6 : 4);
        }
        if (map.getLayer('day-stop-labels')) {
            map.setLayoutProperty('day-stop-labels', 'visibility', interactive ? 'visible' : 'none');
            map.setLayoutProperty('day-stop-labels', 'text-size', interactive ? 11 : 10);
        }
        markersRef.current.forEach((marker)=>marker.remove());
        markersRef.current = [];
        validStops.forEach((stop)=>{
            const role = getStopRole(stop.index - 1, validStops.length);
            const colors = getRoleColors(role, active);
            const element = document.createElement('div');
            element.innerHTML = `
        <div style="
          width:${interactive ? 24 : 20}px;
          height:${interactive ? 24 : 20}px;
          border-radius:999px;
          background:${colors.fill};
          color:#050510;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:${interactive ? 11 : 10}px;
          font-weight:700;
          box-shadow:0 0 0 2px rgba(5,5,16,0.8);
        ">${stop.index}</div>
      `;
            const marker = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].Marker({
                element,
                anchor: 'center'
            }).setLngLat([
                stop.longitude,
                stop.latitude
            ]).addTo(map);
            markersRef.current.push(marker);
        });
        fitMapToStops(map);
    }, [
        validStops,
        active,
        mapReady,
        interactive,
        fitMapToStops
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const map = mapRef.current;
        if (!map || !mapReady) return;
        const frame = window.requestAnimationFrame(()=>{
            map.resize();
            fitMapToStops(map);
        });
        return ()=>window.cancelAnimationFrame(frame);
    }, [
        mapHeightClassName,
        mapReady,
        interactive,
        validStops,
        fitMapToStops
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        onClick: onClick,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('group min-w-[220px] overflow-hidden rounded-[24px] border bg-black/40 text-left transition-colors shadow-[0_18px_60px_rgba(0,0,0,0.28)]', active ? 'border-amber-400/32 bg-amber-400/[0.06]' : 'border-white/12 hover:border-white/22 hover:bg-white/[0.045]', onClick ? 'cursor-pointer' : '', className),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('relative w-full overflow-hidden border-b border-white/12 bg-[#060814]', mapHeightClassName),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "rounded-full border border-white/12 bg-[rgba(8,10,18,0.78)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/78 shadow-[0_10px_20px_rgba(0,0,0,0.22)]",
                                children: "Walking Map"
                            }, void 0, false, {
                                fileName: "[project]/components/trips/TripDayMap.tsx",
                                lineNumber: 465,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "rounded-full border border-white/12 bg-[rgba(8,10,18,0.78)] px-2.5 py-1 text-[10px] font-medium tabular-nums text-white/76 shadow-[0_10px_20px_rgba(0,0,0,0.22)]",
                                children: [
                                    validStops.length,
                                    " stop",
                                    validStops.length === 1 ? '' : 's'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/trips/TripDayMap.tsx",
                                lineNumber: 468,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/trips/TripDayMap.tsx",
                        lineNumber: 464,
                        columnNumber: 9
                    }, this),
                    routeSummary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pointer-events-none absolute inset-x-3 bottom-3 z-10",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "inline-flex max-w-full items-center gap-2 rounded-full border border-white/12 bg-[rgba(8,10,18,0.8)] px-3 py-1.5 shadow-[0_10px_20px_rgba(0,0,0,0.24)]",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('h-2 w-2 rounded-full', active ? 'bg-amber-300' : 'bg-sky-300')
                                }, void 0, false, {
                                    fileName: "[project]/components/trips/TripDayMap.tsx",
                                    lineNumber: 475,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "truncate text-[11px] font-medium tracking-[0.01em] text-white/84",
                                    children: routeSummary
                                }, void 0, false, {
                                    fileName: "[project]/components/trips/TripDayMap.tsx",
                                    lineNumber: 476,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/trips/TripDayMap.tsx",
                            lineNumber: 474,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/trips/TripDayMap.tsx",
                        lineNumber: 473,
                        columnNumber: 11
                    }, this),
                    validStops.length > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pointer-events-none absolute left-3 top-12 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-[rgba(8,10,18,0.76)] px-2.5 py-1 text-[10px] font-medium text-emerald-100/92",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "h-2 w-2 rounded-full bg-emerald-300"
                                    }, void 0, false, {
                                        fileName: "[project]/components/trips/TripDayMap.tsx",
                                        lineNumber: 483,
                                        columnNumber: 15
                                    }, this),
                                    "Start: ",
                                    startStop?.title
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/trips/TripDayMap.tsx",
                                lineNumber: 482,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-[rgba(8,10,18,0.76)] px-2.5 py-1 text-[10px] font-medium text-amber-100/92",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "h-2 w-2 rounded-full bg-amber-300"
                                    }, void 0, false, {
                                        fileName: "[project]/components/trips/TripDayMap.tsx",
                                        lineNumber: 487,
                                        columnNumber: 15
                                    }, this),
                                    "Finish: ",
                                    endStop?.title
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/trips/TripDayMap.tsx",
                                lineNumber: 486,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/trips/TripDayMap.tsx",
                        lineNumber: 481,
                        columnNumber: 11
                    }, this),
                    shouldRenderInteractive ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: containerRef,
                        className: "h-full w-full"
                    }, void 0, false, {
                        fileName: "[project]/components/trips/TripDayMap.tsx",
                        lineNumber: 493,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-full w-full bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.14),transparent_58%),linear-gradient(180deg,rgba(9,12,24,0.96),rgba(4,5,12,0.98))]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:28px_28px] opacity-35"
                            }, void 0, false, {
                                fileName: "[project]/components/trips/TripDayMap.tsx",
                                lineNumber: 496,
                                columnNumber: 13
                            }, this),
                            (previewGeometry || stopOnlyPreview) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                viewBox: "0 0 100 100",
                                className: "h-full w-full",
                                children: [
                                    (previewGeometry || stopOnlyPreview)?.linePoints && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                        points: (previewGeometry || stopOnlyPreview).linePoints,
                                        fill: "none",
                                        stroke: active ? 'rgba(251,191,36,0.95)' : 'rgba(125,211,252,0.92)',
                                        strokeWidth: "2.75",
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round"
                                    }, void 0, false, {
                                        fileName: "[project]/components/trips/TripDayMap.tsx",
                                        lineNumber: 500,
                                        columnNumber: 19
                                    }, this),
                                    (previewGeometry || stopOnlyPreview).pointNodes.map((point, index, points)=>{
                                        const role = getStopRole(index, points.length);
                                        const colors = getRoleColors(role, active);
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                    cx: point.x,
                                                    cy: point.y,
                                                    r: "4.8",
                                                    fill: colors.halo,
                                                    stroke: colors.outline,
                                                    strokeWidth: "1.2"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/trips/TripDayMap.tsx",
                                                    lineNumber: 514,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                    cx: point.x,
                                                    cy: point.y,
                                                    r: "2.2",
                                                    fill: colors.fill
                                                }, void 0, false, {
                                                    fileName: "[project]/components/trips/TripDayMap.tsx",
                                                    lineNumber: 522,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                                    x: point.x,
                                                    y: point.y + 0.8,
                                                    textAnchor: "middle",
                                                    fontSize: "3.5",
                                                    fontWeight: "700",
                                                    fill: "rgba(5,5,16,0.95)",
                                                    children: point.index
                                                }, void 0, false, {
                                                    fileName: "[project]/components/trips/TripDayMap.tsx",
                                                    lineNumber: 528,
                                                    columnNumber: 21
                                                }, this),
                                                !interactive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                                    x: point.x,
                                                    y: point.y + 8,
                                                    textAnchor: "middle",
                                                    fontSize: "3.25",
                                                    fontWeight: "600",
                                                    letterSpacing: "0.02em",
                                                    fill: "rgba(255,255,255,0.9)",
                                                    children: point.title.slice(0, 18)
                                                }, void 0, false, {
                                                    fileName: "[project]/components/trips/TripDayMap.tsx",
                                                    lineNumber: 539,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, point.id, true, {
                                            fileName: "[project]/components/trips/TripDayMap.tsx",
                                            lineNumber: 513,
                                            columnNumber: 19
                                        }, this);
                                    })
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/trips/TripDayMap.tsx",
                                lineNumber: 498,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/trips/TripDayMap.tsx",
                        lineNumber: 495,
                        columnNumber: 11
                    }, this),
                    validStops.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 flex items-center justify-center bg-black/45 text-center",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "max-w-[160px] text-xs text-white/45",
                            children: "Add place-aware activities to draw this day on the map."
                        }, void 0, false, {
                            fileName: "[project]/components/trips/TripDayMap.tsx",
                            lineNumber: 559,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/trips/TripDayMap.tsx",
                        lineNumber: 558,
                        columnNumber: 11
                    }, this),
                    !shouldRenderInteractive && !previewGeometry && !stopOnlyPreview && validStops.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 flex items-center justify-center bg-black/45 text-center",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "max-w-[180px] text-xs text-white/45",
                            children: "Day preview could not be drawn from the current stop geometry."
                        }, void 0, false, {
                            fileName: "[project]/components/trips/TripDayMap.tsx",
                            lineNumber: 566,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/trips/TripDayMap.tsx",
                        lineNumber: 565,
                        columnNumber: 11
                    }, this),
                    interactive && !shouldRenderInteractive && validStops.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pointer-events-none absolute bottom-3 right-3 rounded-full border border-amber-300/20 bg-[rgba(8,10,18,0.82)] px-2.5 py-1 text-[10px] font-medium text-amber-100/92",
                        children: "Static map fallback"
                    }, void 0, false, {
                        fileName: "[project]/components/trips/TripDayMap.tsx",
                        lineNumber: 572,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/trips/TripDayMap.tsx",
                lineNumber: 463,
                columnNumber: 7
            }, this),
            showDetails && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-3.5 py-3.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-start justify-between gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "min-w-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "truncate text-sm font-medium tracking-[0.01em] text-white",
                                        children: title
                                    }, void 0, false, {
                                        fileName: "[project]/components/trips/TripDayMap.tsx",
                                        lineNumber: 582,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 text-[11px] leading-relaxed text-white/62 truncate",
                                        children: subtitle || `${validStops.length} mapped stop${validStops.length === 1 ? '' : 's'}`
                                    }, void 0, false, {
                                        fileName: "[project]/components/trips/TripDayMap.tsx",
                                        lineNumber: 583,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/trips/TripDayMap.tsx",
                                lineNumber: 581,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "inline-flex flex-shrink-0 rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/62",
                                children: "Day"
                            }, void 0, false, {
                                fileName: "[project]/components/trips/TripDayMap.tsx",
                                lineNumber: 587,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/trips/TripDayMap.tsx",
                        lineNumber: 580,
                        columnNumber: 11
                    }, this),
                    !routeSummary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-2 text-[11px] font-medium text-white/76",
                        children: validStops.length > 0 ? 'Route ready to review' : 'No mapped stops yet'
                    }, void 0, false, {
                        fileName: "[project]/components/trips/TripDayMap.tsx",
                        lineNumber: 592,
                        columnNumber: 13
                    }, this),
                    routeSummary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-2 text-[11px] font-medium text-amber-200 truncate",
                        children: routeSummary
                    }, void 0, false, {
                        fileName: "[project]/components/trips/TripDayMap.tsx",
                        lineNumber: 597,
                        columnNumber: 13
                    }, this),
                    startStop && endStop && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-3 grid gap-2 sm:grid-cols-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.08] px-3 py-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100/74",
                                        children: "Start"
                                    }, void 0, false, {
                                        fileName: "[project]/components/trips/TripDayMap.tsx",
                                        lineNumber: 604,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 truncate text-xs font-medium text-white",
                                        children: startStop.title
                                    }, void 0, false, {
                                        fileName: "[project]/components/trips/TripDayMap.tsx",
                                        lineNumber: 605,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/trips/TripDayMap.tsx",
                                lineNumber: 603,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-2xl border border-amber-300/15 bg-amber-300/[0.08] px-3 py-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100/74",
                                        children: "Finish"
                                    }, void 0, false, {
                                        fileName: "[project]/components/trips/TripDayMap.tsx",
                                        lineNumber: 608,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 truncate text-xs font-medium text-white",
                                        children: endStop.title
                                    }, void 0, false, {
                                        fileName: "[project]/components/trips/TripDayMap.tsx",
                                        lineNumber: 609,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/trips/TripDayMap.tsx",
                                lineNumber: 607,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/trips/TripDayMap.tsx",
                        lineNumber: 602,
                        columnNumber: 13
                    }, this),
                    stopPreview.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-3 flex flex-wrap gap-1.5",
                        children: [
                            stopPreview.slice(0, 3).map((stop, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "inline-flex max-w-[142px] items-center gap-1 rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[10px] text-white/72",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-semibold tabular-nums text-amber-200",
                                            children: index + 1
                                        }, void 0, false, {
                                            fileName: "[project]/components/trips/TripDayMap.tsx",
                                            lineNumber: 620,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "truncate",
                                            children: stop
                                        }, void 0, false, {
                                            fileName: "[project]/components/trips/TripDayMap.tsx",
                                            lineNumber: 621,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, `${stop}-${index}`, true, {
                                    fileName: "[project]/components/trips/TripDayMap.tsx",
                                    lineNumber: 616,
                                    columnNumber: 17
                                }, this)),
                            stopPreview.length > 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "inline-flex items-center rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] text-white/55",
                                children: [
                                    "+",
                                    stopPreview.length - 3,
                                    " more"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/trips/TripDayMap.tsx",
                                lineNumber: 625,
                                columnNumber: 17
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/trips/TripDayMap.tsx",
                        lineNumber: 614,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/trips/TripDayMap.tsx",
                lineNumber: 579,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/trips/TripDayMap.tsx",
        lineNumber: 452,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/trips/derivedStops.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildDisplayStops",
    ()=>buildDisplayStops,
    "coerceCoordinate",
    ()=>coerceCoordinate,
    "getDestinationFallback",
    ()=>getDestinationFallback
]);
'use client';
function coerceCoordinate(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}
function getDestinationFallback(title) {
    const normalized = title?.trim().toLowerCase() || '';
    if (/\brome\b/.test(normalized)) {
        return {
            title: 'Rome',
            latitude: 41.9028,
            longitude: 12.4964
        };
    }
    if (/\bvatican\b/.test(normalized)) {
        return {
            title: 'Vatican City',
            latitude: 41.9029,
            longitude: 12.4534
        };
    }
    return null;
}
const DERIVED_STOP_RULES = [
    {
        pattern: /colosseum.*roman forum|roman forum.*colosseum/i,
        stops: [
            {
                title: 'Colosseum',
                latitude: 41.89021,
                longitude: 12.49223
            },
            {
                title: 'Roman Forum',
                latitude: 41.89246,
                longitude: 12.48533
            }
        ]
    },
    {
        pattern: /vatican museums.*sistine chapel|sistine chapel.*vatican museums/i,
        stops: [
            {
                title: 'Vatican Museums',
                latitude: 41.90649,
                longitude: 12.45362
            },
            {
                title: 'Sistine Chapel',
                latitude: 41.90293,
                longitude: 12.45486
            }
        ]
    },
    {
        pattern: /la taverna dei fori imperiali/i,
        stops: [
            {
                title: 'La Taverna dei Fori Imperiali',
                latitude: 41.89303,
                longitude: 12.48923
            }
        ]
    },
    {
        pattern: /piazza navona/i,
        stops: [
            {
                title: 'Piazza Navona',
                latitude: 41.89893,
                longitude: 12.47307
            }
        ]
    },
    {
        pattern: /pizzarium bonci|bonci/i,
        stops: [
            {
                title: 'Pizzarium Bonci',
                latitude: 41.90708,
                longitude: 12.44645
            }
        ]
    },
    {
        pattern: /st\.?\s*peter'?s basilica/i,
        stops: [
            {
                title: "St. Peter's Basilica",
                latitude: 41.90217,
                longitude: 12.45394
            }
        ]
    },
    {
        pattern: /pantheon/i,
        stops: [
            {
                title: 'Pantheon',
                latitude: 41.89861,
                longitude: 12.47687
            }
        ]
    },
    {
        pattern: /panino divino/i,
        stops: [
            {
                title: 'Panino Divino',
                latitude: 41.90623,
                longitude: 12.45742
            }
        ]
    },
    {
        pattern: /trevi fountain/i,
        stops: [
            {
                title: 'Trevi Fountain',
                latitude: 41.90093,
                longitude: 12.48331
            }
        ]
    },
    {
        pattern: /spanish steps/i,
        stops: [
            {
                title: 'Spanish Steps',
                latitude: 41.90599,
                longitude: 12.48278
            }
        ]
    },
    {
        pattern: /villa borghese/i,
        stops: [
            {
                title: 'Villa Borghese Gardens',
                latitude: 41.9142,
                longitude: 12.49232
            }
        ]
    },
    {
        pattern: /casina valadier/i,
        stops: [
            {
                title: 'Casina Valadier',
                latitude: 41.91398,
                longitude: 12.48617
            }
        ]
    },
    {
        pattern: /trastevere/i,
        stops: [
            {
                title: 'Trastevere',
                latitude: 41.88802,
                longitude: 12.46984
            }
        ]
    }
];
function buildDisplayStops(items) {
    const sortedItems = [
        ...items
    ].sort((a, b)=>a.order_index - b.order_index);
    const displayStops = [];
    for (const item of sortedItems){
        const timeLabel = [
            item.start_time,
            item.end_time
        ].filter(Boolean).join('–') || null;
        const derivedStops = DERIVED_STOP_RULES.find((entry)=>entry.pattern.test(item.title))?.stops || null;
        if (derivedStops) {
            for (const stop of derivedStops){
                displayStops.push({
                    id: `${item.id}:${stop.title}`,
                    title: stop.title,
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                    index: displayStops.length + 1,
                    item,
                    placeName: stop.title,
                    country: item.place?.country || 'Italy',
                    timeLabel,
                    mapped: true
                });
            }
            continue;
        }
        const latitude = coerceCoordinate(item.place?.latitude);
        const longitude = coerceCoordinate(item.place?.longitude);
        displayStops.push({
            id: item.id,
            title: item.place?.name || item.title,
            latitude: latitude || 0,
            longitude: longitude || 0,
            index: displayStops.length + 1,
            item,
            placeName: item.place?.name || null,
            country: item.place?.country || null,
            timeLabel,
            mapped: latitude != null && longitude != null
        });
    }
    return displayStops;
}
}),
"[project]/app/(app)/chat/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ChatPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-ssr] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$compass$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Compass$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/compass.js [app-ssr] (ecmascript) <export default as Compass>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.js [app-ssr] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pinned$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPinned$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/map-pinned.js [app-ssr] (ecmascript) <export default as MapPinned>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/external-link.js [app-ssr] (ecmascript) <export default as ExternalLink>");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useChat$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/useChat.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$chat$2f$ChatInterface$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/chat/ChatInterface.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$trips$2f$TripDayMap$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/trips/TripDayMap.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$trips$2f$derivedStops$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/trips/derivedStops.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
;
;
;
const CHAT_MAP_STORAGE_KEY = 'globe-travel:chat:explore:map-stops';
const CHAT_ACTIVE_TRIP_KEY = 'globe-travel:chat:active-trip-id';
function mergeStop(stops, nextStop) {
    const existing = stops.findIndex((stop)=>{
        if (stop.id === nextStop.id) return true;
        if (stop.title.toLowerCase() === nextStop.title.toLowerCase()) return true;
        return Math.abs(stop.latitude - nextStop.latitude) < 0.0001 && Math.abs(stop.longitude - nextStop.longitude) < 0.0001;
    });
    const merged = existing >= 0 ? stops.map((stop, index)=>index === existing ? {
            ...stop,
            ...nextStop
        } : stop) : [
        ...stops,
        {
            ...nextStop,
            index: stops.length + 1
        }
    ];
    return merged.map((stop, index)=>({
            ...stop,
            index: index + 1
        }));
}
function ChatPage() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [activeTripId, setActiveTripId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return null;
        //TURBOPACK unreachable
        ;
    });
    const [selectedDayIndex, setSelectedDayIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1);
    const [mapStops, setMapStops] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return [];
        //TURBOPACK unreachable
        ;
    });
    const handlePlaceAdded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((event)=>{
        setMapStops((current)=>mergeStop(current, {
                id: `${event.place.name}:${event.place.latitude}:${event.place.longitude}`,
                title: event.place.name,
                latitude: event.place.latitude,
                longitude: event.place.longitude
            }));
    }, []);
    const handleNavigate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((event)=>{
        if (!event.latitude || !event.longitude) return;
        setMapStops((current)=>mergeStop(current, {
                id: `${event.name || 'place'}:${event.latitude}:${event.longitude}`,
                title: event.name || 'Selected place',
                latitude: event.latitude,
                longitude: event.longitude
            }));
    }, []);
    const exploreChat = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useChat$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useChat"])({
        type: 'explore',
        onPlaceAdded: handlePlaceAdded,
        onNavigate: handleNavigate
    });
    const { data: tripPayload, isError: tripPreviewFailed } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            'chat-trip-preview',
            activeTripId
        ],
        enabled: Boolean(activeTripId),
        queryFn: async ()=>{
            const res = await fetch(`/api/trips/${activeTripId}`, {
                cache: 'no-store'
            });
            if (!res.ok) throw new Error('Failed to load trip preview');
            return res.json();
        },
        retry: 1
    });
    // If the stored activeTripId no longer exists, clear it so a new trip is created next time.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (tripPreviewFailed && activeTripId) {
            setActiveTripId(null);
        }
    }, [
        tripPreviewFailed,
        activeTripId
    ]);
    const isPlanningPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((text)=>{
        const normalized = text.toLowerCase();
        return /\b(itinerary|trip plan|plan a trip|plan my trip|plan\b|day\s*\d+|days in|weekend in|day trip|walking tour|food tour)\b/.test(normalized) || /\b\d+\s+day\b/.test(normalized);
    }, []);
    const extractDraftDays = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((text)=>{
        const match = text.match(/\b(\d+)\s+days?\b/i);
        if (!match) return 4;
        const parsed = Number(match[1]);
        return Number.isFinite(parsed) ? Math.min(14, Math.max(1, parsed)) : 4;
    }, []);
    const extractDraftTitle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((text)=>{
        const inMatch = text.match(/\b(?:in|to)\s+([A-Z][A-Za-z\s'’-]{1,40})/i);
        if (inMatch?.[1]) {
            const days = extractDraftDays(text);
            return `${days} Days in ${inMatch[1].trim()}`;
        }
        return 'Trip Draft';
    }, [
        extractDraftDays
    ]);
    const createDraftTrip = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (prompt)=>{
        const res = await fetch('/api/trips', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: extractDraftTitle(prompt),
                pace: 'balanced',
                budget_level: 'mid',
                constraints: {
                    days: extractDraftDays(prompt)
                }
            })
        });
        if (!res.ok) throw new Error('Failed to create trip draft');
        const json = await res.json();
        setActiveTripId(json.tripId);
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return json.tripId;
    }, [
        extractDraftDays,
        extractDraftTitle
    ]);
    const activeMessages = exploreChat.messages;
    const activeLoading = exploreChat.isLoading;
    const activeError = exploreChat.error;
    const activeStop = exploreChat.stop;
    const handleBack = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) {
            router.push('/explore');
            return;
        }
        //TURBOPACK unreachable
        ;
        const sameOriginReferrer = undefined;
    }, [
        router
    ]);
    const [planningError, setPlanningError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [planningInProgress, setPlanningInProgress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const sendMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (content)=>{
        const trimmed = content.trim();
        if (!trimmed) return;
        if (isPlanningPrompt(trimmed)) {
            setPlanningError(null);
            setPlanningInProgress(true);
            try {
                const tripId = activeTripId || await createDraftTrip(trimmed);
                const target = `/trips/${tripId}?prompt=${encodeURIComponent(trimmed)}`;
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
                else {
                    router.push(target);
                }
            } catch  {
                setPlanningError('Could not start trip planning. Please try again.');
                setPlanningInProgress(false);
            }
            return;
        }
        exploreChat.sendMessage(trimmed);
    }, [
        activeTripId,
        createDraftTrip,
        exploreChat,
        isPlanningPrompt,
        router
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    }, [
        mapStops
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    }, [
        activeTripId
    ]);
    const tripDays = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>tripPayload?.days || [], [
        tripPayload?.days
    ]);
    const resolvedSelectedDayIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!tripDays.length) return selectedDayIndex;
        return tripDays.some((day)=>day.day_index === selectedDayIndex) ? selectedDayIndex : tripDays[0].day_index;
    }, [
        selectedDayIndex,
        tripDays
    ]);
    const mapSubtitle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (tripDays.length) {
            const mappedDays = tripDays.filter((day)=>(day.items || []).some((item)=>item.place?.latitude != null && item.place?.longitude != null)).length;
            return `${mappedDays} mapped day${mappedDays === 1 ? '' : 's'} in this itinerary`;
        }
        if (mapStops.length === 0) return 'Ask about a destination to see it mapped here.';
        return `${mapStops.length} mapped place${mapStops.length === 1 ? '' : 's'} from this chat`;
    }, [
        mapStops,
        tripDays
    ]);
    const previewDays = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        return tripDays.map((day)=>{
            const stops = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$trips$2f$derivedStops$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildDisplayStops"])(day.items || []).filter((stop)=>stop.mapped).map((stop)=>({
                    id: stop.id,
                    title: stop.title,
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                    index: stop.index
                }));
            return {
                day,
                stops,
                routeGeojson: day.routes?.find((route)=>route.mode === 'walk')?.geojson || day.routes?.[0]?.geojson || null,
                routeSummary: day.routes?.[0]?.distance_m && day.routes?.[0]?.duration_s ? `${Math.round(day.routes[0].distance_m / 100) / 10} km • ${Math.round(day.routes[0].duration_s / 60)} min walk` : null
            };
        });
    }, [
        tripDays
    ]);
    const destinationFallback = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$trips$2f$derivedStops$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDestinationFallback"])(tripPayload?.trip.title), [
        tripPayload?.trip.title
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 bg-black flex flex-col",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.03)_0%,transparent_50%)]"
                }, void 0, false, {
                    fileName: "[project]/app/(app)/chat/page.tsx",
                    lineNumber: 274,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/(app)/chat/page.tsx",
                lineNumber: 273,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative z-10 flex-shrink-0 border-b border-white/5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-6 py-4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between max-w-3xl mx-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleBack,
                                        className: "inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-200 shadow-lg shadow-amber-500/10 transition-colors hover:bg-amber-500/20 hover:text-white",
                                        title: "Go back",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                                className: "w-4 h-4"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/chat/page.tsx",
                                                lineNumber: 287,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Back"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/chat/page.tsx",
                                                lineNumber: 288,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/chat/page.tsx",
                                        lineNumber: 282,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                                        initial: {
                                            rotate: 0
                                        },
                                        animate: {
                                            rotate: 360
                                        },
                                        transition: {
                                            duration: 20,
                                            repeat: Infinity,
                                            ease: 'linear'
                                        },
                                        className: "w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$compass$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Compass$3e$__["Compass"], {
                                            className: "w-5 h-5 text-amber-400"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/chat/page.tsx",
                                            lineNumber: 296,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/chat/page.tsx",
                                        lineNumber: 290,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                                className: "font-serif text-xl text-white",
                                                children: "AI Travel Advisor"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/chat/page.tsx",
                                                lineNumber: 299,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-white/40",
                                                children: "Discover your next adventure"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/chat/page.tsx",
                                                lineNumber: 300,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/chat/page.tsx",
                                        lineNumber: 298,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/chat/page.tsx",
                                lineNumber: 281,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                        className: "w-4 h-4 text-amber-400/40"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/chat/page.tsx",
                                        lineNumber: 305,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-white/30",
                                        children: "Powered by OpenAI GPT-5.4"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/chat/page.tsx",
                                        lineNumber: 306,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/chat/page.tsx",
                                lineNumber: 304,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/chat/page.tsx",
                        lineNumber: 280,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/(app)/chat/page.tsx",
                    lineNumber: 279,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/(app)/chat/page.tsx",
                lineNumber: 278,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative z-10 flex-1 min-h-0 px-4 py-4 md:px-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mx-auto grid h-full max-w-7xl gap-4 md:grid-cols-[minmax(0,1fr)_360px]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "min-h-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]",
                            children: activeMessages.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex h-full items-center justify-center px-6",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                                    initial: {
                                        opacity: 0,
                                        y: 20
                                    },
                                    animate: {
                                        opacity: 1,
                                        y: 0
                                    },
                                    className: "text-center max-w-md",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                                            animate: {
                                                y: [
                                                    0,
                                                    -8,
                                                    0
                                                ]
                                            },
                                            transition: {
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: 'easeInOut'
                                            },
                                            className: "w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$compass$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Compass$3e$__["Compass"], {
                                                className: "w-8 h-8 text-amber-400/60"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/chat/page.tsx",
                                                lineNumber: 327,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/chat/page.tsx",
                                            lineNumber: 322,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "font-serif text-2xl text-white mb-3",
                                            children: "Where to next?"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/chat/page.tsx",
                                            lineNumber: 329,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-white/40 mb-8 leading-relaxed",
                                            children: "Ask me for destination recommendations, trip planning help, local tips, or anything travel-related. I know your preferences and can suggest perfect spots for you."
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/chat/page.tsx",
                                            lineNumber: 332,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex flex-wrap justify-center gap-2",
                                            children: [
                                                'Suggest a weekend getaway',
                                                'Best hidden gems in Europe',
                                                'Plan a 2-week Asia trip',
                                                'Beach destinations in winter'
                                            ].map((suggestion)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].button, {
                                                    whileHover: {
                                                        scale: 1.03
                                                    },
                                                    whileTap: {
                                                        scale: 0.97
                                                    },
                                                    onClick: ()=>sendMessage(suggestion),
                                                    className: "px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white/70 hover:bg-white/10 transition-all",
                                                    children: suggestion
                                                }, suggestion, false, {
                                                    fileName: "[project]/app/(app)/chat/page.tsx",
                                                    lineNumber: 345,
                                                    columnNumber: 23
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/chat/page.tsx",
                                            lineNumber: 338,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(app)/chat/page.tsx",
                                    lineNumber: 317,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/chat/page.tsx",
                                lineNumber: 316,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$chat$2f$ChatInterface$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                messages: activeMessages,
                                isLoading: activeLoading,
                                error: activeError,
                                onSendMessage: sendMessage,
                                onStop: activeStop,
                                placeholder: activeTripId ? 'Refine this itinerary, change a day, or ask for walking routes...' : 'Ask about destinations, trips, or travel tips...',
                                storageKey: activeTripId ? `globe-travel:chat-input:plan:${activeTripId}` : 'globe-travel:chat-input:explore'
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/chat/page.tsx",
                                lineNumber: 359,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/(app)/chat/page.tsx",
                            lineNumber: 314,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex min-h-[280px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "border-b border-white/10 px-4 py-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[10px] uppercase tracking-[0.18em] text-white/30",
                                            children: tripPayload ? 'Itinerary Maps' : 'Map Preview'
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/chat/page.tsx",
                                            lineNumber: 373,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "mt-1 text-sm font-medium text-white/80",
                                            children: tripPayload ? tripPayload.trip.title : 'Places from this chat'
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/chat/page.tsx",
                                            lineNumber: 376,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "mt-1 text-xs text-white/40",
                                            children: mapSubtitle
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/chat/page.tsx",
                                            lineNumber: 379,
                                            columnNumber: 15
                                        }, this),
                                        activeTripId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-3 flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-200",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pinned$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPinned$3e$__["MapPinned"], {
                                                            className: "h-3.5 w-3.5"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(app)/chat/page.tsx",
                                                            lineNumber: 383,
                                                            columnNumber: 21
                                                        }, this),
                                                        "Trip linked"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(app)/chat/page.tsx",
                                                    lineNumber: 382,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                    href: `/trips/${activeTripId}`,
                                                    className: "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/70 hover:bg-white/10",
                                                    children: [
                                                        "Open Trip Studio",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__["ExternalLink"], {
                                                            className: "h-3.5 w-3.5"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(app)/chat/page.tsx",
                                                            lineNumber: 391,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(app)/chat/page.tsx",
                                                    lineNumber: 386,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(app)/chat/page.tsx",
                                            lineNumber: 381,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(app)/chat/page.tsx",
                                    lineNumber: 372,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex-1 overflow-y-auto p-3",
                                    children: previewDays.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-3",
                                        children: previewDays.map(({ day, stops, routeGeojson, routeSummary })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$trips$2f$TripDayMap$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                stops: stops,
                                                routeGeojson: routeGeojson,
                                                title: `Day ${day.day_index}${day.title ? ` · ${day.title}` : ''}`,
                                                subtitle: `${stops.length} mapped stop${stops.length === 1 ? '' : 's'}`,
                                                routeSummary: routeSummary,
                                                active: resolvedSelectedDayIndex === day.day_index,
                                                onClick: ()=>setSelectedDayIndex(day.day_index),
                                                mapHeightClassName: "h-44",
                                                className: "min-w-0"
                                            }, day.id, false, {
                                                fileName: "[project]/app/(app)/chat/page.tsx",
                                                lineNumber: 400,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/chat/page.tsx",
                                        lineNumber: 398,
                                        columnNumber: 17
                                    }, this) : destinationFallback ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$trips$2f$TripDayMap$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        stops: [
                                            {
                                                id: `destination:${destinationFallback.title}`,
                                                title: destinationFallback.title,
                                                latitude: destinationFallback.latitude,
                                                longitude: destinationFallback.longitude,
                                                index: 1
                                            }
                                        ],
                                        title: destinationFallback.title,
                                        subtitle: "Destination preview",
                                        showDetails: false,
                                        mapHeightClassName: "h-full min-h-[220px]",
                                        className: "h-full min-h-[220px] min-w-0"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/chat/page.tsx",
                                        lineNumber: 415,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$trips$2f$TripDayMap$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        stops: mapStops,
                                        title: "Chat Map",
                                        subtitle: mapSubtitle,
                                        showDetails: false,
                                        mapHeightClassName: "h-full min-h-[220px]",
                                        className: "h-full min-h-[220px] min-w-0"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/chat/page.tsx",
                                        lineNumber: 430,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/(app)/chat/page.tsx",
                                    lineNumber: 396,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(app)/chat/page.tsx",
                            lineNumber: 371,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/(app)/chat/page.tsx",
                    lineNumber: 313,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/(app)/chat/page.tsx",
                lineNumber: 312,
                columnNumber: 7
            }, this),
            activeMessages.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative z-10 flex-shrink-0 border-t border-white/10 bg-black/40 backdrop-blur-xl px-4 py-3",
                children: [
                    planningError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "max-w-3xl mx-auto mb-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300",
                        children: planningError
                    }, void 0, false, {
                        fileName: "[project]/app/(app)/chat/page.tsx",
                        lineNumber: 448,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3 max-w-3xl mx-auto",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "text",
                            placeholder: planningInProgress ? 'Opening Trip Studio…' : 'Ask about destinations, trips, or travel tips...',
                            disabled: planningInProgress,
                            className: "flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all disabled:opacity-50",
                            onKeyDown: (e)=>{
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    sendMessage(e.currentTarget.value.trim());
                                    e.currentTarget.value = '';
                                }
                            }
                        }, void 0, false, {
                            fileName: "[project]/app/(app)/chat/page.tsx",
                            lineNumber: 453,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/(app)/chat/page.tsx",
                        lineNumber: 452,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(app)/chat/page.tsx",
                lineNumber: 446,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(app)/chat/page.tsx",
        lineNumber: 271,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=_b54a93db._.js.map