(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/hooks/useChat.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useChat",
    ()=>useChat
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$react$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@ai-sdk/react/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/ai/dist/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
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
    _s();
    const optionsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(options);
    const seenToolCallsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Set());
    const hadPlanActivityRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useChat.useEffect": ()=>{
            optionsRef.current = options;
        }
    }["useChat.useEffect"], [
        options
    ]);
    const { messages: aiMessages, status, error: aiError, sendMessage: aiSendMessage, stop, setMessages: setAIMessages } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$react$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChat"])({
        transport: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ai$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DefaultChatTransport"]({
            api: '/api/chat',
            body: {
                type: options.type,
                conversationId: options.conversationId,
                tripId: options.tripId
            }
        })
    });
    const parseToolOutput = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useChat.useCallback[parseToolOutput]": (output)=>{
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
        }
    }["useChat.useCallback[parseToolOutput]"], []);
    // Watch for tool call results in messages and fire events
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useChat.useEffect": ()=>{
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
        }
    }["useChat.useEffect"], [
        aiMessages,
        parseToolOutput
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useChat.useEffect": ()=>{
            if (status === 'ready' && optionsRef.current.type === 'plan' && optionsRef.current.tripId && optionsRef.current.onTripPatch && hadPlanActivityRef.current) {
                hadPlanActivityRef.current = false;
                optionsRef.current.onTripPatch(optionsRef.current.tripId);
            }
        }
    }["useChat.useEffect"], [
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
    const sendMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useChat.useCallback[sendMessage]": async (content)=>{
            if (optionsRef.current.type === 'plan') {
                hadPlanActivityRef.current = true;
            }
            aiSendMessage({
                text: content
            });
        }
    }["useChat.useCallback[sendMessage]"], [
        aiSendMessage
    ]);
    const setMessages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useChat.useCallback[setMessages]": (msgs)=>{
            setAIMessages(msgs.map({
                "useChat.useCallback[setMessages]": (m)=>({
                        id: m.id,
                        role: m.role,
                        parts: [
                            {
                                type: 'text',
                                text: m.content
                            }
                        ]
                    })
            }["useChat.useCallback[setMessages]"]));
        }
    }["useChat.useCallback[setMessages]"], [
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
_s(useChat, "N2Jf1+wVVGbTJu9X71wnlZixOR4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$ai$2d$sdk$2f$react$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChat"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/chat/ChatMessage.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ChatMessage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
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
            processed = parts.map((part, j)=>j % 2 === 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
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
            processed = parts.map((part, j)=>j % 2 === 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
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
            elements.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
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
            elements.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
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
            elements.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, i, false, {
                fileName: "[project]/components/chat/ChatMessage.tsx",
                lineNumber: 65,
                columnNumber: 21
            }, this));
            return;
        }
        elements.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            children: [
                processed,
                i < lines.length - 1 && lines[i + 1]?.trim() !== '' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
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
            !isUser && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-shrink-0 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-sm",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? 'bg-amber-500/20 backdrop-blur-sm border border-amber-500/20 text-amber-50' : 'bg-white/10 backdrop-blur-sm border border-white/10 text-white/90'}`,
                children: message.content ? renderContent(message.content) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_c = ChatMessage;
var _c;
__turbopack_context__.k.register(_c, "ChatMessage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/chat/TypingIndicator.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TypingIndicator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
'use client';
;
;
function TypingIndicator() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex gap-3 justify-start",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-shrink-0 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-sm",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-1.5",
                children: [
                    0,
                    1,
                    2
                ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
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
_c = TypingIndicator;
var _c;
__turbopack_context__.k.register(_c, "TypingIndicator");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/chat/ChatInterface.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ChatInterface
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/send.js [app-client] (ecmascript) <export default as Send>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/square.js [app-client] (ecmascript) <export default as Square>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$chat$2f$ChatMessage$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/chat/ChatMessage.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$chat$2f$TypingIndicator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/chat/TypingIndicator.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
function ChatInterface({ messages, isLoading, error, onSendMessage, onStop, placeholder = 'Type your message...', suggestions = [], storageKey: _storageKey }) {
    _s();
    void _storageKey;
    const [input, setInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Auto-scroll to bottom on new messages
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChatInterface.useEffect": ()=>{
            messagesEndRef.current?.scrollIntoView({
                behavior: 'smooth'
            });
        }
    }["ChatInterface.useEffect"], [
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col h-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto px-4 py-6 space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                        mode: "popLayout",
                        children: messages.filter((m)=>m.content || m.role === 'user').map((message, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$chat$2f$ChatMessage$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
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
                    showTyping && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$chat$2f$TypingIndicator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/components/chat/ChatInterface.tsx",
                        lineNumber: 84,
                        columnNumber: 24
                    }, this),
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/components/chat/ChatInterface.tsx",
                        lineNumber: 87,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-shrink-0 border-t border-white/10 bg-black/40 backdrop-blur-xl px-4 py-3",
                children: [
                    suggestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "max-w-3xl mx-auto mb-2 flex gap-2 overflow-x-auto pb-1",
                        children: suggestions.slice(0, 6).map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].button, {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-2xl px-3 py-1.5 focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10 transition-all",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
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
                            isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].button, {
                                whileHover: {
                                    scale: 1.05
                                },
                                whileTap: {
                                    scale: 0.95
                                },
                                onClick: onStop,
                                className: "flex-shrink-0 w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__["Square"], {
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
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].button, {
                                whileHover: {
                                    scale: 1.05
                                },
                                whileTap: {
                                    scale: 0.95
                                },
                                onClick: handleSend,
                                disabled: !input.trim(),
                                className: "flex-shrink-0 w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-black hover:bg-amber-400 transition-colors disabled:opacity-20 disabled:cursor-default disabled:bg-white/10 disabled:text-white/30",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__["Send"], {
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
_s(ChatInterface, "5KFydcI3uCVT1/xmHDbrF2LCfc8=");
_c = ChatInterface;
var _c;
__turbopack_context__.k.register(_c, "ChatInterface");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/trips/TripDayMap.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TripDayMap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/mapbox-gl/dist/mapbox-gl.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
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
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const markersRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const [mapReady, setMapReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mapFailed, setMapFailed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const mapboxToken = ("TURBOPACK compile-time value", "pk.eyJ1Ijoid2lsbDA3MDgiLCJhIjoiY21tcno5dXAxMWZmNjJxcTY3NDNvNGZhbSJ9.k-9ORP8DXlW-ljJVHAn08g");
    const shouldRenderInteractive = interactive && Boolean(mapboxToken) && !mapFailed;
    const validStops = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TripDayMap.useMemo[validStops]": ()=>stops.map({
                "TripDayMap.useMemo[validStops]": (stop)=>{
                    const latitude = coerceCoordinate(stop.latitude);
                    const longitude = coerceCoordinate(stop.longitude);
                    if (latitude == null || longitude == null) return null;
                    return {
                        ...stop,
                        latitude,
                        longitude
                    };
                }
            }["TripDayMap.useMemo[validStops]"]).filter({
                "TripDayMap.useMemo[validStops]": (stop)=>stop !== null
            }["TripDayMap.useMemo[validStops]"])
    }["TripDayMap.useMemo[validStops]"], [
        stops
    ]);
    const previewGeometry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TripDayMap.useMemo[previewGeometry]": ()=>{
            const lineFeature = routeGeojson && routeGeojson.type === 'Feature' ? routeGeojson : routeGeojson && routeGeojson.type === 'FeatureCollection' && routeGeojson.features.find({
                "TripDayMap.useMemo[previewGeometry]": (feature)=>feature.geometry?.type === 'LineString'
            }["TripDayMap.useMemo[previewGeometry]"]) ? routeGeojson.features.find({
                "TripDayMap.useMemo[previewGeometry]": (feature)=>feature.geometry?.type === 'LineString'
            }["TripDayMap.useMemo[previewGeometry]"]) : null;
            const lineCoordinates = lineFeature?.geometry?.type === 'LineString' ? lineFeature.geometry.coordinates.filter({
                "TripDayMap.useMemo[previewGeometry]": (coordinate)=>coordinate.length >= 2
            }["TripDayMap.useMemo[previewGeometry]"]).map({
                "TripDayMap.useMemo[previewGeometry]": (coordinate)=>[
                        coordinate[0],
                        coordinate[1]
                    ]
            }["TripDayMap.useMemo[previewGeometry]"]) : validStops.map({
                "TripDayMap.useMemo[previewGeometry]": (stop)=>[
                        stop.longitude,
                        stop.latitude
                    ]
            }["TripDayMap.useMemo[previewGeometry]"]);
            const points = validStops.map({
                "TripDayMap.useMemo[previewGeometry].points": (stop)=>({
                        ...stop,
                        longitude: stop.longitude,
                        latitude: stop.latitude
                    })
            }["TripDayMap.useMemo[previewGeometry].points"]);
            const allCoordinates = [
                ...lineCoordinates,
                ...points.map({
                    "TripDayMap.useMemo[previewGeometry]": (point)=>[
                            point.longitude,
                            point.latitude
                        ]
                }["TripDayMap.useMemo[previewGeometry]"])
            ];
            if (allCoordinates.length === 0) return null;
            const longitudes = allCoordinates.map({
                "TripDayMap.useMemo[previewGeometry].longitudes": ([longitude])=>longitude
            }["TripDayMap.useMemo[previewGeometry].longitudes"]);
            const latitudes = allCoordinates.map({
                "TripDayMap.useMemo[previewGeometry].latitudes": ([, latitude])=>latitude
            }["TripDayMap.useMemo[previewGeometry].latitudes"]);
            const minLng = Math.min(...longitudes);
            const maxLng = Math.max(...longitudes);
            const minLat = Math.min(...latitudes);
            const maxLat = Math.max(...latitudes);
            const lngSpan = Math.max(maxLng - minLng, 0.01);
            const latSpan = Math.max(maxLat - minLat, 0.01);
            const padding = 24;
            const width = 100;
            const height = 100;
            const project = {
                "TripDayMap.useMemo[previewGeometry].project": ([longitude, latitude])=>{
                    const x = padding + (longitude - minLng) / lngSpan * (width - padding * 2);
                    const y = height - padding - (latitude - minLat) / latSpan * (height - padding * 2);
                    return [
                        x,
                        y
                    ];
                }
            }["TripDayMap.useMemo[previewGeometry].project"];
            return {
                linePoints: lineCoordinates.map(project).map({
                    "TripDayMap.useMemo[previewGeometry]": ([x, y])=>`${x},${y}`
                }["TripDayMap.useMemo[previewGeometry]"]).join(' '),
                pointNodes: points.map({
                    "TripDayMap.useMemo[previewGeometry]": (point)=>{
                        const [x, y] = project([
                            point.longitude,
                            point.latitude
                        ]);
                        return {
                            ...point,
                            x,
                            y
                        };
                    }
                }["TripDayMap.useMemo[previewGeometry]"])
            };
        }
    }["TripDayMap.useMemo[previewGeometry]"], [
        routeGeojson,
        validStops
    ]);
    const stopOnlyPreview = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TripDayMap.useMemo[stopOnlyPreview]": ()=>buildStopPath(validStops)
    }["TripDayMap.useMemo[stopOnlyPreview]"], [
        validStops
    ]);
    const startStop = validStops[0] || null;
    const endStop = validStops.length > 1 ? validStops[validStops.length - 1] : validStops[0] || null;
    const fitMapToStops = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TripDayMap.useCallback[fitMapToStops]": (map)=>{
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
            const bounds = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].LngLatBounds();
            validStops.forEach({
                "TripDayMap.useCallback[fitMapToStops]": (stop)=>bounds.extend([
                        stop.longitude,
                        stop.latitude
                    ])
            }["TripDayMap.useCallback[fitMapToStops]"]);
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
        }
    }["TripDayMap.useCallback[fitMapToStops]"], [
        interactive,
        validStops
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TripDayMap.useEffect": ()=>{
            if (!interactive) return;
            if (!containerRef.current) return;
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].accessToken = mapboxToken;
            let map;
            try {
                map = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Map({
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
                queueMicrotask({
                    "TripDayMap.useEffect": ()=>setMapFailed(true)
                }["TripDayMap.useEffect"]);
                return;
            }
            mapRef.current = map;
            if (interactive) {
                map.addControl(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].NavigationControl({
                    showCompass: false
                }), 'top-right');
            }
            map.on('error', {
                "TripDayMap.useEffect": ()=>{
                    setMapFailed(true);
                }
            }["TripDayMap.useEffect"]);
            map.on('load', {
                "TripDayMap.useEffect": ()=>{
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
                }
            }["TripDayMap.useEffect"]);
            return ({
                "TripDayMap.useEffect": ()=>{
                    setMapReady(false);
                    markersRef.current.forEach({
                        "TripDayMap.useEffect": (marker)=>marker.remove()
                    }["TripDayMap.useEffect"]);
                    markersRef.current = [];
                    map.remove();
                    mapRef.current = null;
                }
            })["TripDayMap.useEffect"];
        }
    }["TripDayMap.useEffect"], [
        interactive,
        mapboxToken
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TripDayMap.useEffect": ()=>{
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
        }
    }["TripDayMap.useEffect"], [
        routeGeojson,
        active,
        mapReady
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TripDayMap.useEffect": ()=>{
            const map = mapRef.current;
            if (!map || !mapReady) return;
            const stopSource = map.getSource('day-stops');
            if (stopSource) {
                stopSource.setData({
                    type: 'FeatureCollection',
                    features: validStops.map({
                        "TripDayMap.useEffect": (stop)=>({
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
                            })
                    }["TripDayMap.useEffect"])
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
            markersRef.current.forEach({
                "TripDayMap.useEffect": (marker)=>marker.remove()
            }["TripDayMap.useEffect"]);
            markersRef.current = [];
            validStops.forEach({
                "TripDayMap.useEffect": (stop)=>{
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
                    const marker = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Marker({
                        element,
                        anchor: 'center'
                    }).setLngLat([
                        stop.longitude,
                        stop.latitude
                    ]).addTo(map);
                    markersRef.current.push(marker);
                }
            }["TripDayMap.useEffect"]);
            fitMapToStops(map);
        }
    }["TripDayMap.useEffect"], [
        validStops,
        active,
        mapReady,
        interactive,
        fitMapToStops
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TripDayMap.useEffect": ()=>{
            const map = mapRef.current;
            if (!map || !mapReady) return;
            const frame = window.requestAnimationFrame({
                "TripDayMap.useEffect.frame": ()=>{
                    map.resize();
                    fitMapToStops(map);
                }
            }["TripDayMap.useEffect.frame"]);
            return ({
                "TripDayMap.useEffect": ()=>window.cancelAnimationFrame(frame)
            })["TripDayMap.useEffect"];
        }
    }["TripDayMap.useEffect"], [
        mapHeightClassName,
        mapReady,
        interactive,
        validStops,
        fitMapToStops
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        onClick: onClick,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('group min-w-[220px] overflow-hidden rounded-[24px] border bg-black/40 text-left transition-colors shadow-[0_18px_60px_rgba(0,0,0,0.28)]', active ? 'border-amber-400/32 bg-amber-400/[0.06]' : 'border-white/12 hover:border-white/22 hover:bg-white/[0.045]', onClick ? 'cursor-pointer' : '', className),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('relative w-full overflow-hidden border-b border-white/12 bg-[#060814]', mapHeightClassName),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "rounded-full border border-white/12 bg-[rgba(8,10,18,0.78)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/78 shadow-[0_10px_20px_rgba(0,0,0,0.22)]",
                                children: "Walking Map"
                            }, void 0, false, {
                                fileName: "[project]/components/trips/TripDayMap.tsx",
                                lineNumber: 465,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                    routeSummary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pointer-events-none absolute inset-x-3 bottom-3 z-10",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "inline-flex max-w-full items-center gap-2 rounded-full border border-white/12 bg-[rgba(8,10,18,0.8)] px-3 py-1.5 shadow-[0_10px_20px_rgba(0,0,0,0.24)]",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('h-2 w-2 rounded-full', active ? 'bg-amber-300' : 'bg-sky-300')
                                }, void 0, false, {
                                    fileName: "[project]/components/trips/TripDayMap.tsx",
                                    lineNumber: 475,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                    validStops.length > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pointer-events-none absolute left-3 top-12 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-[rgba(8,10,18,0.76)] px-2.5 py-1 text-[10px] font-medium text-emerald-100/92",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-[rgba(8,10,18,0.76)] px-2.5 py-1 text-[10px] font-medium text-amber-100/92",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                    shouldRenderInteractive ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: containerRef,
                        className: "h-full w-full"
                    }, void 0, false, {
                        fileName: "[project]/components/trips/TripDayMap.tsx",
                        lineNumber: 493,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-full w-full bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.14),transparent_58%),linear-gradient(180deg,rgba(9,12,24,0.96),rgba(4,5,12,0.98))]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:28px_28px] opacity-35"
                            }, void 0, false, {
                                fileName: "[project]/components/trips/TripDayMap.tsx",
                                lineNumber: 496,
                                columnNumber: 13
                            }, this),
                            (previewGeometry || stopOnlyPreview) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                viewBox: "0 0 100 100",
                                className: "h-full w-full",
                                children: [
                                    (previewGeometry || stopOnlyPreview)?.linePoints && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
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
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
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
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                    cx: point.x,
                                                    cy: point.y,
                                                    r: "2.2",
                                                    fill: colors.fill
                                                }, void 0, false, {
                                                    fileName: "[project]/components/trips/TripDayMap.tsx",
                                                    lineNumber: 522,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
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
                                                !interactive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
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
                    validStops.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 flex items-center justify-center bg-black/45 text-center",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
                    !shouldRenderInteractive && !previewGeometry && !stopOnlyPreview && validStops.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 flex items-center justify-center bg-black/45 text-center",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
                    interactive && !shouldRenderInteractive && validStops.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
            showDetails && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-3.5 py-3.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-start justify-between gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "min-w-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "truncate text-sm font-medium tracking-[0.01em] text-white",
                                        children: title
                                    }, void 0, false, {
                                        fileName: "[project]/components/trips/TripDayMap.tsx",
                                        lineNumber: 582,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                    !routeSummary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-2 text-[11px] font-medium text-white/76",
                        children: validStops.length > 0 ? 'Route ready to review' : 'No mapped stops yet'
                    }, void 0, false, {
                        fileName: "[project]/components/trips/TripDayMap.tsx",
                        lineNumber: 592,
                        columnNumber: 13
                    }, this),
                    routeSummary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-2 text-[11px] font-medium text-amber-200 truncate",
                        children: routeSummary
                    }, void 0, false, {
                        fileName: "[project]/components/trips/TripDayMap.tsx",
                        lineNumber: 597,
                        columnNumber: 13
                    }, this),
                    startStop && endStop && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-3 grid gap-2 sm:grid-cols-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.08] px-3 py-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100/74",
                                        children: "Start"
                                    }, void 0, false, {
                                        fileName: "[project]/components/trips/TripDayMap.tsx",
                                        lineNumber: 604,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-2xl border border-amber-300/15 bg-amber-300/[0.08] px-3 py-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100/74",
                                        children: "Finish"
                                    }, void 0, false, {
                                        fileName: "[project]/components/trips/TripDayMap.tsx",
                                        lineNumber: 608,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
                    stopPreview.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-3 flex flex-wrap gap-1.5",
                        children: [
                            stopPreview.slice(0, 3).map((stop, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "inline-flex max-w-[142px] items-center gap-1 rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[10px] text-white/72",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-semibold tabular-nums text-amber-200",
                                            children: index + 1
                                        }, void 0, false, {
                                            fileName: "[project]/components/trips/TripDayMap.tsx",
                                            lineNumber: 620,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                            stopPreview.length > 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_s(TripDayMap, "v3b/8BxihoF3EfBCqpMfeApekjE=");
_c = TripDayMap;
var _c;
__turbopack_context__.k.register(_c, "TripDayMap");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/trips/derivedStops.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/trips/ItineraryArtifact.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ItineraryArtifact
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grip$2d$vertical$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__GripVertical$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/grip-vertical.js [app-client] (ecmascript) <export default as GripVertical>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/pencil.js [app-client] (ecmascript) <export default as Pencil>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.js [app-client] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$maximize$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Maximize2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/maximize-2.js [app-client] (ecmascript) <export default as Maximize2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$minimize$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Minimize2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/minimize-2.js [app-client] (ecmascript) <export default as Minimize2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/map-pin.js [app-client] (ecmascript) <export default as MapPin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$trips$2f$TripDayMap$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/trips/TripDayMap.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$trips$2f$derivedStops$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/trips/derivedStops.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
function timeChip(start, end) {
    if (!start && !end) return null;
    const label = [
        start,
        end
    ].filter(Boolean).join('–');
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/60",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                className: "w-3 h-3 text-white/30"
            }, void 0, false, {
                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                lineNumber: 61,
                columnNumber: 7
            }, this),
            label
        ]
    }, void 0, true, {
        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
        lineNumber: 60,
        columnNumber: 5
    }, this);
}
function ItineraryArtifact({ tripTitle, days, selectedDayIndex, setSelectedDayIndex, onSelectItem, onBulkOps, onRegenerateDay, onSwapItem, isLoading }) {
    _s();
    const selectedDay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ItineraryArtifact.useMemo[selectedDay]": ()=>days.find({
                "ItineraryArtifact.useMemo[selectedDay]": (d)=>d.day_index === selectedDayIndex
            }["ItineraryArtifact.useMemo[selectedDay]"]) || days[0]
    }["ItineraryArtifact.useMemo[selectedDay]"], [
        days,
        selectedDayIndex
    ]);
    const [dragOverItemId, setDragOverItemId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editingItemId, setEditingItemId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editingTitle, setEditingTitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [mapExpanded, setMapExpanded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const dayMapCards = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ItineraryArtifact.useMemo[dayMapCards]": ()=>{
            return days.map({
                "ItineraryArtifact.useMemo[dayMapCards]": (day)=>{
                    const sortedDayItems = [
                        ...day.items || []
                    ].sort({
                        "ItineraryArtifact.useMemo[dayMapCards].sortedDayItems": (a, b)=>a.order_index - b.order_index
                    }["ItineraryArtifact.useMemo[dayMapCards].sortedDayItems"]);
                    const displayStops = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$trips$2f$derivedStops$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildDisplayStops"])(sortedDayItems);
                    const stops = displayStops.filter({
                        "ItineraryArtifact.useMemo[dayMapCards].stops": (stop)=>stop.mapped
                    }["ItineraryArtifact.useMemo[dayMapCards].stops"]);
                    const routeGeojson = day.routes?.find({
                        "ItineraryArtifact.useMemo[dayMapCards]": (route)=>route.mode === 'walk'
                    }["ItineraryArtifact.useMemo[dayMapCards]"])?.geojson || day.routes?.[0]?.geojson || null;
                    const route = day.routes?.find({
                        "ItineraryArtifact.useMemo[dayMapCards]": (entry)=>entry.mode === 'walk'
                    }["ItineraryArtifact.useMemo[dayMapCards]"]) || day.routes?.[0];
                    const routeSummary = route?.distance_m && route?.duration_s ? `${Math.round(route.distance_m / 100) / 10} km • ${Math.round(route.duration_s / 60)} min walk` : null;
                    const subtitleParts = [
                        day.date,
                        `${stops.length} stop${stops.length === 1 ? '' : 's'}`
                    ].filter(Boolean);
                    return {
                        day,
                        sortedItems: sortedDayItems,
                        displayStops,
                        stops,
                        routeGeojson,
                        subtitle: subtitleParts.join(' • '),
                        routeSummary,
                        stopPreview: displayStops.map({
                            "ItineraryArtifact.useMemo[dayMapCards]": (stop)=>stop.title
                        }["ItineraryArtifact.useMemo[dayMapCards]"])
                    };
                }
            }["ItineraryArtifact.useMemo[dayMapCards]"]);
        }
    }["ItineraryArtifact.useMemo[dayMapCards]"], [
        days
    ]);
    const selectedDayMap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ItineraryArtifact.useMemo[selectedDayMap]": ()=>{
            const selectedCard = dayMapCards.find({
                "ItineraryArtifact.useMemo[selectedDayMap].selectedCard": ({ day })=>day.day_index === selectedDay?.day_index
            }["ItineraryArtifact.useMemo[selectedDayMap].selectedCard"]);
            if (!selectedCard) return null;
            return {
                routeGeojson: selectedCard.routeGeojson,
                routeSummary: selectedCard.routeSummary,
                mappedStops: selectedCard.stops,
                stopDetails: selectedCard.displayStops
            };
        }
    }["ItineraryArtifact.useMemo[selectedDayMap]"], [
        dayMapCards,
        selectedDay
    ]);
    const handleDragStart = (item, fromDayIndex, e)=>{
        e.dataTransfer.setData('application/json', JSON.stringify({
            kind: 'trip_item',
            item_id: item.id,
            from_day_index: fromDayIndex
        }));
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDropOnList = async (dayIndex, sortedDayItems, toIndex, e)=>{
        e.preventDefault();
        setDragOverItemId(null);
        let payload = null;
        try {
            payload = JSON.parse(e.dataTransfer.getData('application/json'));
        } catch  {
            return;
        }
        if (!payload || payload.kind !== 'trip_item') return;
        const itemId = payload.item_id;
        const fromDayIndex = payload.from_day_index;
        if (fromDayIndex !== dayIndex) {
            await onBulkOps([
                {
                    op: 'move',
                    item_id: itemId,
                    to_day_index: dayIndex,
                    to_order_index: toIndex
                }
            ]);
            return;
        }
        const ids = sortedDayItems.map((it)=>it.id).filter((id)=>id !== itemId);
        ids.splice(toIndex, 0, itemId);
        await onBulkOps([
            {
                op: 'reorder',
                day_index: dayIndex,
                ordered_item_ids: ids
            }
        ]);
    };
    const startEditing = (item)=>{
        setEditingItemId(item.id);
        setEditingTitle(item.title);
    };
    const commitEditing = async ()=>{
        if (!editingItemId) return;
        const trimmed = editingTitle.trim();
        setEditingItemId(null);
        if (!trimmed) return;
        await onBulkOps([
            {
                op: 'update',
                item_id: editingItemId,
                fields: {
                    title: trimmed
                }
            }
        ]);
    };
    const deleteItem = async (itemId)=>{
        await onBulkOps([
            {
                op: 'delete',
                item_id: itemId
            }
        ]);
    };
    if (!selectedDay) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-full flex items-center justify-center text-white/40 text-sm",
            children: "Create a trip to start planning."
        }, void 0, false, {
            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
            lineNumber: 179,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-full flex flex-col",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-shrink-0 border-b border-white/12 px-5 py-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "min-w-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] uppercase tracking-[0.24em] text-white/38",
                                        children: "Itinerary"
                                    }, void 0, false, {
                                        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                        lineNumber: 190,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "truncate text-base font-medium text-white",
                                        children: tripTitle
                                    }, void 0, false, {
                                        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                        lineNumber: 191,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                lineNumber: 189,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>onRegenerateDay?.(selectedDay.day_index),
                                    className: "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/82 transition-colors hover:bg-white/12",
                                    title: "Regenerate this day",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                            className: "w-3.5 h-3.5"
                                        }, void 0, false, {
                                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                            lineNumber: 199,
                                            columnNumber: 15
                                        }, this),
                                        "Regen"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                    lineNumber: 194,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                lineNumber: 193,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                        lineNumber: 188,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-3 flex items-center gap-2 overflow-x-auto",
                        children: days.map((d)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setSelectedDayIndex(d.day_index),
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors', d.day_index === selectedDay.day_index ? 'bg-amber-500/15 border-amber-500/25 text-amber-300' : 'bg-black/40 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5'),
                                children: [
                                    "Day ",
                                    d.day_index
                                ]
                            }, d.id, true, {
                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                lineNumber: 207,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                        lineNumber: 205,
                        columnNumber: 9
                    }, this),
                    selectedDayMap && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4 rounded-[26px] border border-white/12 bg-white/[0.05] p-3.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "min-w-0",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[10px] uppercase tracking-[0.2em] text-white/40",
                                                children: "Selected route"
                                            }, void 0, false, {
                                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                lineNumber: 226,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-1 truncate text-sm font-medium text-white",
                                                children: [
                                                    "Day ",
                                                    selectedDay.day_index,
                                                    " map"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                lineNumber: 227,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-1 text-[11px] leading-relaxed text-white/66 truncate",
                                                children: selectedDayMap.routeSummary || `${selectedDayMap.mappedStops.length} mapped stop${selectedDayMap.mappedStops.length === 1 ? '' : 's'}`
                                            }, void 0, false, {
                                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                lineNumber: 230,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                        lineNumber: 225,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setMapExpanded((current)=>!current),
                                        className: "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/82 transition-colors hover:bg-white/12",
                                        children: [
                                            mapExpanded ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$minimize$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Minimize2$3e$__["Minimize2"], {
                                                className: "h-3.5 w-3.5"
                                            }, void 0, false, {
                                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                lineNumber: 239,
                                                columnNumber: 32
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$maximize$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Maximize2$3e$__["Maximize2"], {
                                                className: "h-3.5 w-3.5"
                                            }, void 0, false, {
                                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                lineNumber: 239,
                                                columnNumber: 72
                                            }, this),
                                            mapExpanded ? 'Shrink' : 'Enlarge'
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                        lineNumber: 235,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                lineNumber: 224,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-3",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$trips$2f$TripDayMap$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    stops: selectedDayMap.mappedStops,
                                    routeGeojson: selectedDayMap.routeGeojson,
                                    title: `Day ${selectedDay.day_index}`,
                                    subtitle: selectedDay.title,
                                    routeSummary: selectedDayMap.routeSummary,
                                    showDetails: false,
                                    mapHeightClassName: mapExpanded ? 'h-80' : 'h-56',
                                    className: "min-w-0 overflow-hidden"
                                }, void 0, false, {
                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                    lineNumber: 245,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                lineNumber: 244,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-3 grid gap-2",
                                children: selectedDayMap.stopDetails.map((stop, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>onSelectItem?.(stop.item),
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors', stop.mapped ? 'border-white/12 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]' : 'border-amber-500/20 bg-amber-500/[0.06] hover:bg-amber-500/[0.1]'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-400/90 text-[11px] font-semibold text-black",
                                                children: index + 1
                                            }, void 0, false, {
                                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                lineNumber: 269,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "min-w-0 flex-1",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-[10px] uppercase tracking-[0.16em] text-white/38",
                                                        children: [
                                                            "Stop ",
                                                            index + 1
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                        lineNumber: 273,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2 flex-wrap",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-xs font-medium text-white",
                                                                children: stop.title
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                lineNumber: 277,
                                                                columnNumber: 23
                                                            }, this),
                                                            stop.timeLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "rounded-full border border-white/12 bg-white/8 px-2 py-0.5 text-[10px] text-white/62",
                                                                children: stop.timeLabel
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                lineNumber: 279,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                        lineNumber: 276,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "mt-1 text-[11px] text-white/62 truncate",
                                                        children: [
                                                            stop.placeName || 'No pinned place yet',
                                                            stop.country ? ` • ${stop.country}` : ''
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                        lineNumber: 284,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                lineNumber: 272,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('inline-flex flex-shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px]', stop.mapped ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/20 bg-amber-500/10 text-amber-300'),
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
                                                        className: "h-3 w-3"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                        lineNumber: 295,
                                                        columnNumber: 21
                                                    }, this),
                                                    stop.mapped ? 'Pinned' : 'Needs map data'
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                lineNumber: 289,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, stop.id, true, {
                                        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                        lineNumber: 259,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                lineNumber: 257,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                        lineNumber: 223,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                lineNumber: 187,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 min-h-0 overflow-y-auto p-5 space-y-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                    mode: "popLayout",
                    children: dayMapCards.map(({ day, sortedItems, stops, routeGeojson, routeSummary, subtitle, stopPreview, displayStops })=>{
                        const isSelectedDay = day.day_index === selectedDay.day_index;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].section, {
                            layout: true,
                            initial: {
                                opacity: 0,
                                y: 8
                            },
                            animate: {
                                opacity: 1,
                                y: 0
                            },
                            exit: {
                                opacity: 0,
                                y: -8
                            },
                            transition: {
                                duration: 0.18
                            },
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-[28px] border p-4.5', isSelectedDay ? 'border-amber-400/28 bg-amber-400/[0.055]' : 'border-white/12 bg-white/[0.035]'),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start justify-between gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setSelectedDayIndex(day.day_index),
                                            className: "min-w-0 text-left",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[11px] uppercase tracking-[0.22em] text-white/42",
                                                    children: [
                                                        "Day ",
                                                        day.day_index
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                    lineNumber: 322,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "mt-1 text-sm font-medium text-white",
                                                    children: day.title || `Itinerary for Day ${day.day_index}`
                                                }, void 0, false, {
                                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                    lineNumber: 323,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-1 text-xs text-white/62",
                                                    children: subtitle || `${sortedItems.length} item${sortedItems.length === 1 ? '' : 's'}`
                                                }, void 0, false, {
                                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                    lineNumber: 324,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                            lineNumber: 321,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>onRegenerateDay?.(day.day_index),
                                            className: "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/82 transition-colors hover:bg-white/12",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                                    className: "h-3.5 w-3.5"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                    lineNumber: 330,
                                                    columnNumber: 21
                                                }, this),
                                                "Regenerate day"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                            lineNumber: 326,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                    lineNumber: 320,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$trips$2f$TripDayMap$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        stops: stops,
                                        routeGeojson: routeGeojson,
                                        title: `Day ${day.day_index}`,
                                        subtitle: day.title,
                                        routeSummary: routeSummary,
                                        stopPreview: stopPreview,
                                        showDetails: false,
                                        active: isSelectedDay,
                                        mapHeightClassName: isSelectedDay ? 'h-56' : 'h-44',
                                        className: "min-w-0 overflow-hidden",
                                        onClick: ()=>setSelectedDayIndex(day.day_index)
                                    }, void 0, false, {
                                        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                        lineNumber: 336,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                    lineNumber: 335,
                                    columnNumber: 17
                                }, this),
                                displayStops.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-3 grid gap-2 sm:grid-cols-2",
                                    children: displayStops.map((stop, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>onSelectItem?.(stop.item),
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors', stop.mapped ? 'border-white/12 bg-white/[0.05] hover:border-white/22 hover:bg-white/[0.07]' : 'border-amber-500/20 bg-amber-500/[0.06] hover:bg-amber-500/[0.1]'),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-400/90 text-[11px] font-semibold text-black",
                                                    children: index + 1
                                                }, void 0, false, {
                                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                    lineNumber: 364,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "min-w-0 flex-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-[10px] uppercase tracking-[0.16em] text-white/38",
                                                            children: [
                                                                "Stop ",
                                                                index + 1
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                            lineNumber: 368,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center gap-2 flex-wrap",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-xs font-medium text-white",
                                                                    children: stop.title
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                    lineNumber: 372,
                                                                    columnNumber: 29
                                                                }, this),
                                                                stop.timeLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "rounded-full border border-white/12 bg-white/8 px-2 py-0.5 text-[10px] text-white/62",
                                                                    children: stop.timeLabel
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                    lineNumber: 374,
                                                                    columnNumber: 31
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                            lineNumber: 371,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "mt-1 text-[11px] text-white/62 truncate",
                                                            children: [
                                                                stop.placeName || 'No pinned place yet',
                                                                stop.country ? ` • ${stop.country}` : ''
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                            lineNumber: 379,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                    lineNumber: 367,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, stop.id, true, {
                                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                            lineNumber: 354,
                                            columnNumber: 23
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                    lineNumber: 352,
                                    columnNumber: 19
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 space-y-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            onDragOver: (e)=>e.preventDefault(),
                                            onDrop: (e)=>handleDropOnList(day.day_index, sortedItems, 0, e),
                                            className: "h-2 rounded-lg"
                                        }, void 0, false, {
                                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                            lineNumber: 390,
                                            columnNumber: 19
                                        }, this),
                                        sortedItems.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        draggable: true,
                                                        onDragStart: (e)=>handleDragStart(item, day.day_index, e),
                                                        onDragOver: (e)=>{
                                                            e.preventDefault();
                                                            setSelectedDayIndex(day.day_index);
                                                            setDragOverItemId(item.id);
                                                        },
                                                        onDragLeave: ()=>{
                                                            setDragOverItemId((prev)=>prev === item.id ? null : prev);
                                                        },
                                                        onDrop: (e)=>handleDropOnList(day.day_index, sortedItems, index, e),
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('group rounded-2xl border p-3 transition-colors', dragOverItemId === item.id ? 'border-amber-400/35 bg-amber-400/[0.08]' : 'border-white/12 bg-white/8 hover:border-white/22'),
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-start gap-3",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "mt-0.5 text-white/20 group-hover:text-white/35 transition-colors",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grip$2d$vertical$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__GripVertical$3e$__["GripVertical"], {
                                                                        className: "w-4 h-4"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                        lineNumber: 417,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                    lineNumber: 416,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>{
                                                                        setSelectedDayIndex(day.day_index);
                                                                        onSelectItem?.(item);
                                                                    },
                                                                    className: "flex-1 min-w-0 text-left",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex items-center gap-2 flex-wrap",
                                                                            children: [
                                                                                timeChip(item.start_time, item.end_time),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: "text-[10px] px-2 py-1 rounded-full bg-black/40 border border-white/10 text-white/40",
                                                                                    children: item.type
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                                    lineNumber: 429,
                                                                                    columnNumber: 31
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                            lineNumber: 427,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "mt-2",
                                                                            children: [
                                                                                editingItemId === item.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                    autoFocus: true,
                                                                                    value: editingTitle,
                                                                                    onChange: (e)=>setEditingTitle(e.target.value),
                                                                                    onBlur: commitEditing,
                                                                                    onKeyDown: (e)=>{
                                                                                        if (e.key === 'Enter') commitEditing();
                                                                                        if (e.key === 'Escape') setEditingItemId(null);
                                                                                    },
                                                                                    className: "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/40"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                                    lineNumber: 436,
                                                                                    columnNumber: 33
                                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                    className: "truncate text-sm font-medium text-white",
                                                                                    children: item.title
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                                    lineNumber: 448,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                item.place?.country && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                    className: "mt-0.5 truncate text-xs text-white/55",
                                                                                    children: item.place.country
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                                    lineNumber: 453,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                item.notes && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                    className: "mt-2 line-clamp-2 text-xs text-white/62",
                                                                                    children: item.notes
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                                    lineNumber: 458,
                                                                                    columnNumber: 33
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                            lineNumber: 434,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                    lineNumber: 420,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            onClick: ()=>startEditing(item),
                                                                            className: "w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors",
                                                                            title: "Edit title",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__["Pencil"], {
                                                                                className: "w-4 h-4"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                                lineNumber: 471,
                                                                                columnNumber: 31
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                            lineNumber: 466,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            onClick: ()=>onSwapItem?.(item),
                                                                            className: "w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors",
                                                                            title: "Swap this activity",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                                                                className: "w-4 h-4"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                                lineNumber: 478,
                                                                                columnNumber: 31
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                            lineNumber: 473,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            onClick: ()=>deleteItem(item.id),
                                                                            className: "w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-300 transition-colors",
                                                                            title: "Delete",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                                                className: "w-4 h-4"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                                lineNumber: 485,
                                                                                columnNumber: 31
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                            lineNumber: 480,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                                    lineNumber: 465,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                            lineNumber: 415,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                        lineNumber: 398,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        onDragOver: (e)=>e.preventDefault(),
                                                        onDrop: (e)=>handleDropOnList(day.day_index, sortedItems, index + 1, e),
                                                        className: "h-2 rounded-lg"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                        lineNumber: 491,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, item.id, true, {
                                                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                                lineNumber: 397,
                                                columnNumber: 21
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                    lineNumber: 389,
                                    columnNumber: 17
                                }, this),
                                !isLoading && sortedItems.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-5 text-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-white/40",
                                            children: "Ask the AI to build this day."
                                        }, void 0, false, {
                                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                            lineNumber: 502,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "mt-2 text-xs text-white/25",
                                            children: [
                                                "Example: “Plan Day ",
                                                day.day_index,
                                                " around great food and neighborhoods.”"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                            lineNumber: 503,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                                    lineNumber: 501,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, day.id, true, {
                            fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                            lineNumber: 311,
                            columnNumber: 15
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                    lineNumber: 306,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/trips/ItineraryArtifact.tsx",
                lineNumber: 305,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/trips/ItineraryArtifact.tsx",
        lineNumber: 186,
        columnNumber: 5
    }, this);
}
_s(ItineraryArtifact, "01tbKXD99veXYtzTJ15agehz/vU=");
_c = ItineraryArtifact;
var _c;
__turbopack_context__.k.register(_c, "ItineraryArtifact");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/(app)/trips/[tripId]/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TripStudioPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$gestures$2f$drag$2f$use$2d$drag$2d$controls$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/gestures/drag/use-drag-controls.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$share$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Share2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/share-2.js [app-client] (ecmascript) <export default as Share2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeftRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left-right.js [app-client] (ecmascript) <export default as ArrowLeftRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-client] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Link$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/link.js [app-client] (ecmascript) <export default as Link>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/copy.js [app-client] (ecmascript) <export default as Copy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/send.js [app-client] (ecmascript) <export default as Send>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2d$quote$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquareQuote$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-square-quote.js [app-client] (ecmascript) <export default as MessageSquareQuote>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$route$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Route$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/route.js [app-client] (ecmascript) <export default as Route>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grip$2d$horizontal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__GripHorizontal$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/grip-horizontal.js [app-client] (ecmascript) <export default as GripHorizontal>");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useChat$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/useChat.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$chat$2f$ChatInterface$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/chat/ChatInterface.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$trips$2f$ItineraryArtifact$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/trips/ItineraryArtifact.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$trips$2f$derivedStops$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/trips/derivedStops.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
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
const EMPTY_DAYS = [];
const INITIAL_PROMPT_PREFIX = 'globe-travel:trip:initial-prompt:';
const sentimentLabel = {
    love_it: 'Love it',
    curious: 'Curious',
    practical: 'Practical note'
};
const sentimentClasses = {
    love_it: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
    curious: 'border-sky-500/25 bg-sky-500/10 text-sky-300',
    practical: 'border-amber-500/25 bg-amber-500/10 text-amber-300'
};
function extractDestinationLabel(title) {
    if (!title) return null;
    const cleaned = title.trim();
    const patterns = [
        /^\d+\s+Days?\s+in\s+(.+)$/i,
        /^(.+?)\s+in\s+(January|February|March|April|May|June|July|August|September|October|November|December)\b/i,
        /^(.+?)\s+Day\s+Trip$/i,
        /^Trip to\s+(.+)$/i,
        /^(.+?)\s+Trip$/i
    ];
    for (const pattern of patterns){
        const match = cleaned.match(pattern);
        if (match?.[1]) return match[1].trim();
    }
    return cleaned;
}
function coerceCoordinate(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}
function TripStudioPage() {
    _s();
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const tripId = params.tripId;
    const [selectedDayIndex, setSelectedDayIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [chatOpen, setChatOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isHydratingMaps, setIsHydratingMaps] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const studioRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const flyToRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const hydrationAttemptedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const chatDragControls = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$gestures$2f$drag$2f$use$2d$drag$2d$controls$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDragControls"])();
    const itineraryDragControls = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$gestures$2f$drag$2f$use$2d$drag$2d$controls$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDragControls"])();
    const { data, isLoading, refetch } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            'trip',
            tripId
        ],
        queryFn: {
            "TripStudioPage.useQuery": async ()=>{
                const res = await fetch(`/api/trips/${tripId}`, {
                    cache: 'no-store'
                });
                if (!res.ok) throw new Error('Failed to load trip');
                return res.json();
            }
        }["TripStudioPage.useQuery"],
        retry: 1
    });
    const resolvedPayload = data;
    const trip = resolvedPayload?.trip;
    const days = resolvedPayload?.days ?? EMPTY_DAYS;
    const { data: feedback = [] } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            'trip-feedback',
            tripId
        ],
        queryFn: {
            "TripStudioPage.useQuery": async ()=>{
                const res = await fetch(`/api/trips/${tripId}/feedback`);
                if (!res.ok) return [];
                return res.json();
            }
        }["TripStudioPage.useQuery"]
    });
    const ensureSelectedDayExists = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TripStudioPage.useMemo[ensureSelectedDayExists]": ()=>{
            if (days.length === 0) return 1;
            const has = days.some({
                "TripStudioPage.useMemo[ensureSelectedDayExists].has": (d)=>d.day_index === selectedDayIndex
            }["TripStudioPage.useMemo[ensureSelectedDayExists].has"]);
            return has ? selectedDayIndex : days[0].day_index;
        }
    }["TripStudioPage.useMemo[ensureSelectedDayExists]"], [
        days,
        selectedDayIndex
    ]);
    const tripStops = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TripStudioPage.useMemo[tripStops]": ()=>days.flatMap({
                "TripStudioPage.useMemo[tripStops]": (day)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$trips$2f$derivedStops$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildDisplayStops"])(day.items || [])
            }["TripStudioPage.useMemo[tripStops]"]).filter({
                "TripStudioPage.useMemo[tripStops]": (stop)=>stop.mapped
            }["TripStudioPage.useMemo[tripStops]"]).map({
                "TripStudioPage.useMemo[tripStops]": (stop, index)=>({
                        id: stop.id,
                        title: stop.title,
                        latitude: stop.latitude,
                        longitude: stop.longitude,
                        index: index + 1
                    })
            }["TripStudioPage.useMemo[tripStops]"])
    }["TripStudioPage.useMemo[tripStops]"], [
        days
    ]);
    const tripDestination = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TripStudioPage.useMemo[tripDestination]": ()=>extractDestinationLabel(trip?.title)
    }["TripStudioPage.useMemo[tripDestination]"], [
        trip?.title
    ]);
    const mappingSummary = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TripStudioPage.useMemo[mappingSummary]": ()=>{
            const itemCount = days.reduce({
                "TripStudioPage.useMemo[mappingSummary].itemCount": (sum, day)=>sum + (day.items?.length || 0)
            }["TripStudioPage.useMemo[mappingSummary].itemCount"], 0);
            const mappedItemCount = days.reduce({
                "TripStudioPage.useMemo[mappingSummary].mappedItemCount": (sum, day)=>sum + day.items.filter({
                        "TripStudioPage.useMemo[mappingSummary].mappedItemCount": (item)=>coerceCoordinate(item.place?.latitude) != null && coerceCoordinate(item.place?.longitude) != null
                    }["TripStudioPage.useMemo[mappingSummary].mappedItemCount"]).length
            }["TripStudioPage.useMemo[mappingSummary].mappedItemCount"], 0);
            const routeDayCount = days.filter({
                "TripStudioPage.useMemo[mappingSummary]": (day)=>(day.routes?.length || 0) > 0
            }["TripStudioPage.useMemo[mappingSummary]"]).length;
            return {
                itemCount,
                mappedItemCount,
                routeDayCount,
                needsHydration: itemCount > 0
            };
        }
    }["TripStudioPage.useMemo[mappingSummary]"], [
        days
    ]);
    const onBulkOps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TripStudioPage.useCallback[onBulkOps]": async (ops)=>{
            await fetch(`/api/trips/${tripId}/items/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ops
                })
            });
            await refetch();
        }
    }["TripStudioPage.useCallback[onBulkOps]"], [
        tripId,
        refetch
    ]);
    const onSelectItem = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TripStudioPage.useCallback[onSelectItem]": (item)=>{
            const latitude = coerceCoordinate(item.place?.latitude);
            const longitude = coerceCoordinate(item.place?.longitude);
            if (latitude != null && longitude != null) {
                flyToRef.current?.(latitude, longitude, 4);
            }
        }
    }["TripStudioPage.useCallback[onSelectItem]"], []);
    const refreshTripWithMaps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TripStudioPage.useCallback[refreshTripWithMaps]": async ()=>{
            await fetch(`/api/trips/${tripId}/hydrate-map`, {
                method: 'POST'
            }).catch({
                "TripStudioPage.useCallback[refreshTripWithMaps]": ()=>null
            }["TripStudioPage.useCallback[refreshTripWithMaps]"]);
            await refetch();
        }
    }["TripStudioPage.useCallback[refreshTripWithMaps]"], [
        tripId,
        refetch
    ]);
    const { messages, isLoading: chatLoading, error: chatError, sendMessage, stop } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useChat$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChat"])({
        type: 'plan',
        tripId,
        onTripPatch: {
            "TripStudioPage.useChat": ()=>{
                void refreshTripWithMaps();
            }
        }["TripStudioPage.useChat"],
        onNavigate: {
            "TripStudioPage.useChat": (nav)=>{
                if (coerceCoordinate(nav.latitude) != null && coerceCoordinate(nav.longitude) != null) {
                    flyToRef.current?.(Number(nav.latitude), Number(nav.longitude), 4);
                }
            }
        }["TripStudioPage.useChat"]
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TripStudioPage.useEffect": ()=>{
            if (!tripId || ("TURBOPACK compile-time value", "object") === 'undefined') return;
            const prompt = searchParams.get('prompt')?.trim();
            if (!prompt) return;
            const storageKey = `${INITIAL_PROMPT_PREFIX}${tripId}:${prompt}`;
            if (window.sessionStorage.getItem(storageKey)) return;
            window.sessionStorage.setItem(storageKey, 'sent');
            sendMessage(prompt);
        }
    }["TripStudioPage.useEffect"], [
        searchParams,
        sendMessage,
        tripId
    ]);
    const handleRegenerateDay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TripStudioPage.useCallback[handleRegenerateDay]": (dayIndex)=>{
            sendMessage(`Regenerate Day ${dayIndex} with a better flow. Keep it realistic with timing and neighborhoods.`);
        }
    }["TripStudioPage.useCallback[handleRegenerateDay]"], [
        sendMessage
    ]);
    const handleSwapItem = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TripStudioPage.useCallback[handleSwapItem]": (item)=>{
            sendMessage(`Swap this activity for something better:\nDay ${ensureSelectedDayExists}\nCurrent: ${item.title}\nPreference: similar vibe, nearby, and fits the day's flow.`);
        }
    }["TripStudioPage.useCallback[handleSwapItem]"], [
        sendMessage,
        ensureSelectedDayExists
    ]);
    const handleOptimize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TripStudioPage.useCallback[handleOptimize]": async ()=>{
            await fetch(`/api/trips/${tripId}/days/${ensureSelectedDayExists}/optimize`, {
                method: 'POST'
            });
            await refetch();
        }
    }["TripStudioPage.useCallback[handleOptimize]"], [
        tripId,
        ensureSelectedDayExists,
        refetch
    ]);
    const hydrateMaps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TripStudioPage.useCallback[hydrateMaps]": async ()=>{
            if (isHydratingMaps) return;
            setIsHydratingMaps(true);
            try {
                await fetch(`/api/trips/${tripId}/hydrate-map`, {
                    method: 'POST'
                });
                await refetch();
            } finally{
                setIsHydratingMaps(false);
            }
        }
    }["TripStudioPage.useCallback[hydrateMaps]"], [
        tripId,
        refetch,
        isHydratingMaps
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TripStudioPage.useEffect": ()=>{
            hydrationAttemptedRef.current = null;
        }
    }["TripStudioPage.useEffect"], [
        tripId
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TripStudioPage.useEffect": ()=>{
            if (isLoading || isHydratingMaps || !mappingSummary.needsHydration) return;
            const hydrationKey = `${tripId}:${mappingSummary.itemCount}:${mappingSummary.mappedItemCount}:${mappingSummary.routeDayCount}`;
            if (hydrationAttemptedRef.current === hydrationKey) return;
            hydrationAttemptedRef.current = hydrationKey;
            void hydrateMaps();
        }
    }["TripStudioPage.useEffect"], [
        tripId,
        isLoading,
        isHydratingMaps,
        mappingSummary,
        hydrateMaps
    ]);
    const shareUrl = trip?.share_slug ? `${("TURBOPACK compile-time truthy", 1) ? window.location.origin : "TURBOPACK unreachable"}/t/${trip.share_slug}` : null;
    const inviteMessage = shareUrl ? `Review my trip ideas for ${trip?.title || 'this trip'} and tell me what you think: ${shareUrl}` : '';
    const togglePublic = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TripStudioPage.useCallback[togglePublic]": async ()=>{
            if (!trip) return;
            await fetch(`/api/trips/${tripId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    is_public: !trip.is_public
                })
            });
            await refetch();
        }
    }["TripStudioPage.useCallback[togglePublic]"], [
        tripId,
        trip,
        refetch
    ]);
    const copyInviteLink = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TripStudioPage.useCallback[copyInviteLink]": async ()=>{
            if (!shareUrl) return;
            await navigator.clipboard.writeText(shareUrl);
        }
    }["TripStudioPage.useCallback[copyInviteLink]"], [
        shareUrl
    ]);
    const shareInvite = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TripStudioPage.useCallback[shareInvite]": async ()=>{
            if (!shareUrl) return;
            if (navigator.share) {
                await navigator.share({
                    title: trip?.title || 'Trip ideas',
                    text: inviteMessage,
                    url: shareUrl
                });
                return;
            }
            await navigator.clipboard.writeText(inviteMessage);
        }
    }["TripStudioPage.useCallback[shareInvite]"], [
        shareUrl,
        inviteMessage,
        trip?.title
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: studioRef,
        className: "relative w-full h-full min-h-screen bg-[#050510] overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-full w-full bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.09),transparent_38%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.08),transparent_26%),linear-gradient(180deg,rgba(5,5,16,0.98),rgba(3,4,10,1))]"
                    }, void 0, false, {
                        fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                        lineNumber: 279,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]"
                    }, void 0, false, {
                        fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                        lineNumber: 280,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute right-4 top-4 z-10 rounded-[28px] border border-white/12 bg-[rgba(8,8,14,0.72)] px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] uppercase tracking-[0.24em] text-white/38",
                                children: "Trip Map Status"
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                lineNumber: 282,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-sm font-medium text-white",
                                children: tripDestination || trip?.title || 'Trip Studio'
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                lineNumber: 283,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-2 text-xs text-white/62",
                                children: tripStops.length > 0 ? `${tripStops.length} routed stops across ${days.length} day${days.length === 1 ? '' : 's'}` : 'Using itinerary-first map previews for stability'
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                lineNumber: 284,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                        lineNumber: 281,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                lineNumber: 278,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[min(960px,calc(100%-2rem))]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                    initial: {
                        opacity: 0,
                        y: -15
                    },
                    animate: {
                        opacity: 1,
                        y: 0
                    },
                    className: "flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/15 bg-[rgba(9,9,15,0.78)] px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "min-w-0",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-400/25 bg-amber-400/12",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                                            className: "h-4 w-4 text-amber-300"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                            lineNumber: 302,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                        lineNumber: 301,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "min-w-0",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[10px] uppercase tracking-[0.24em] text-white/45",
                                                children: tripDestination ? `${tripDestination} Trip Studio` : 'Trip Studio'
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                lineNumber: 305,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "truncate text-sm font-medium text-white",
                                                children: trip?.title || 'Trip Studio'
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                lineNumber: 306,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                        lineNumber: 304,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                lineNumber: 300,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                            lineNumber: 299,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-wrap items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: handleOptimize,
                                    className: "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-xs font-medium text-white/82 transition-colors hover:bg-white/12",
                                    title: "Optimize the order for this day",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeftRight$3e$__["ArrowLeftRight"], {
                                            className: "h-4 w-4 text-amber-300"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                            lineNumber: 317,
                                            columnNumber: 15
                                        }, this),
                                        "Optimize day"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                    lineNumber: 312,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: hydrateMaps,
                                    disabled: isHydratingMaps,
                                    className: "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-xs font-medium text-white/82 transition-colors hover:bg-white/12 disabled:opacity-50",
                                    title: "Repair or rebuild day map locations and routes",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$route$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Route$3e$__["Route"], {
                                            className: "h-4 w-4 text-sky-300"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                            lineNumber: 326,
                                            columnNumber: 15
                                        }, this),
                                        isHydratingMaps ? 'Building maps…' : 'Build maps'
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                    lineNumber: 320,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: togglePublic,
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors', trip?.is_public ? 'border-emerald-400/25 bg-emerald-400/12 text-emerald-200 hover:bg-emerald-400/16' : 'border-white/15 bg-white/8 text-white/82 hover:bg-white/12'),
                                    title: "Toggle public sharing",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$share$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Share2$3e$__["Share2"], {
                                            className: "h-4 w-4"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                            lineNumber: 339,
                                            columnNumber: 15
                                        }, this),
                                        trip?.is_public ? 'Public review on' : 'Enable review link'
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                    lineNumber: 329,
                                    columnNumber: 13
                                }, this),
                                trip?.is_public && shareUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: `/t/${trip.share_slug}`,
                                    className: "inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/12 px-3 py-2 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-400/18",
                                    title: "Open public share link",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Link$3e$__["Link"], {
                                            className: "h-4 w-4"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                            lineNumber: 348,
                                            columnNumber: 17
                                        }, this),
                                        "View share"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                    lineNumber: 343,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                            lineNumber: 311,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                    lineNumber: 294,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                lineNumber: 293,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-24 left-1/2 -translate-x-1/2 z-30 w-[min(920px,calc(100%-2rem))] pointer-events-none",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid gap-3 pointer-events-auto md:grid-cols-[1.15fr_0.85fr]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "rounded-[26px] border border-white/12 bg-[rgba(8,8,14,0.7)] px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start justify-between gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "min-w-0",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] uppercase tracking-[0.24em] text-white/38",
                                                    children: "Group review"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                    lineNumber: 362,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-1 text-sm font-medium text-white",
                                                    children: [
                                                        "Invite friends to react to this ",
                                                        tripDestination || 'trip',
                                                        " plan."
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                    lineNumber: 363,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-1 text-xs leading-relaxed text-white/62",
                                                    children: "Keep the planning flow social without burying the itinerary in extra controls."
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                    lineNumber: 364,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                            lineNumber: 361,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2 flex-shrink-0",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: togglePublic,
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-full border px-3 py-2 text-xs font-medium transition-colors', trip?.is_public ? 'border-emerald-400/25 bg-emerald-400/12 text-emerald-200' : 'border-white/15 bg-white/8 text-white/78 hover:bg-white/12'),
                                                children: trip?.is_public ? 'Public link on' : 'Enable public link'
                                            }, void 0, false, {
                                                fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                lineNumber: 369,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                            lineNumber: 368,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                    lineNumber: 360,
                                    columnNumber: 13
                                }, this),
                                trip?.is_public && shareUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 flex flex-wrap items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "min-w-0 flex-1 rounded-2xl border border-white/12 bg-white/7 px-3 py-2 text-xs text-white/72 truncate",
                                            children: shareUrl
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                            lineNumber: 385,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: copyInviteLink,
                                            className: "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-xs font-medium text-white/82 transition-colors hover:bg-white/12",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__["Copy"], {
                                                    className: "w-4 h-4"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                    lineNumber: 392,
                                                    columnNumber: 19
                                                }, this),
                                                "Copy link"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                            lineNumber: 388,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: shareInvite,
                                            className: "inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/12 px-3 py-2 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-400/18",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__["Send"], {
                                                    className: "w-4 h-4"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                    lineNumber: 399,
                                                    columnNumber: 19
                                                }, this),
                                                "Share invite"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                            lineNumber: 395,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                    lineNumber: 384,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-4 text-xs text-white/58",
                                    children: "Reviews open automatically once the trip is public."
                                }, void 0, false, {
                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                    lineNumber: 404,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                            lineNumber: 359,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "rounded-[26px] border border-white/12 bg-[rgba(8,8,14,0.7)] px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] uppercase tracking-[0.24em] text-white/38",
                                                    children: "Friend feedback"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                    lineNumber: 413,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-1 text-sm font-medium text-white",
                                                    children: [
                                                        feedback.length,
                                                        " ",
                                                        feedback.length === 1 ? 'review' : 'reviews'
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                    lineNumber: 414,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                            lineNumber: 412,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2d$quote$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquareQuote$3e$__["MessageSquareQuote"], {
                                            className: "w-5 h-5 text-white/25"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                            lineNumber: 418,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                    lineNumber: 411,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 space-y-2 max-h-40 overflow-y-auto",
                                    children: feedback.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs leading-relaxed text-white/58",
                                        children: "No reviews yet. Invite a few friends and ask them where the itinerary feels too busy or exciting."
                                    }, void 0, false, {
                                        fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                        lineNumber: 423,
                                        columnNumber: 17
                                    }, this) : feedback.slice(0, 3).map((entry)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "rounded-2xl border border-white/12 bg-white/8 p-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center justify-between gap-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "truncate text-xs font-medium text-white",
                                                            children: entry.author_name
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                            lineNumber: 430,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('px-2 py-1 rounded-full border text-[10px]', sentimentClasses[entry.sentiment]),
                                                            children: sentimentLabel[entry.sentiment]
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                            lineNumber: 431,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                    lineNumber: 429,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-2 text-xs leading-relaxed text-white/72 line-clamp-3",
                                                    children: entry.comment
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                    lineNumber: 435,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, entry.id, true, {
                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                            lineNumber: 428,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                    lineNumber: 421,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                            lineNumber: 410,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                    lineNumber: 358,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                lineNumber: 357,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                children: chatOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                    initial: {
                        opacity: 0,
                        x: -20
                    },
                    animate: {
                        opacity: 1,
                        x: 0
                    },
                    exit: {
                        opacity: 0,
                        x: -20
                    },
                    transition: {
                        type: 'spring',
                        damping: 25,
                        stiffness: 350
                    },
                    drag: true,
                    dragControls: chatDragControls,
                    dragListener: false,
                    dragConstraints: studioRef,
                    dragMomentum: false,
                    dragElastic: 0.08,
                    className: "absolute top-[214px] md:top-44 left-4 bottom-4 w-[calc(100%-2rem)] md:w-[360px] z-20 flex flex-col overflow-hidden rounded-[30px] border border-white/12 bg-[rgba(7,7,12,0.82)] shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            onPointerDown: (event)=>chatDragControls.start(event),
                            className: "flex flex-shrink-0 items-center justify-between border-b border-white/12 px-5 py-4 cursor-grab active:cursor-grabbing",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] uppercase tracking-[0.22em] text-white/38",
                                                    children: "Planner chat"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                    lineNumber: 466,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm font-medium text-white",
                                                    children: "Guide the itinerary"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                    lineNumber: 467,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                            lineNumber: 465,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "hidden md:inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-[10px] text-white/55",
                                            title: "Drag chat window",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grip$2d$horizontal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__GripHorizontal$3e$__["GripHorizontal"], {
                                                    className: "h-3.5 w-3.5"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                                    lineNumber: 473,
                                                    columnNumber: 19
                                                }, this),
                                                "Move"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                            lineNumber: 469,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                    lineNumber: 464,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onPointerDown: (event)=>event.stopPropagation(),
                                    onClick: ()=>setChatOpen(false),
                                    className: "w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors",
                                    children: "×"
                                }, void 0, false, {
                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                    lineNumber: 477,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                            lineNumber: 460,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 min-h-0",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$chat$2f$ChatInterface$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                messages: messages,
                                isLoading: chatLoading,
                                error: chatError,
                                onSendMessage: sendMessage,
                                onStop: stop,
                                placeholder: "Tell me where/when you’re going, your vibe, and your must-dos…",
                                storageKey: tripId ? `globe-travel:chat-input:plan:${tripId}` : undefined,
                                suggestions: [
                                    `Plan Day ${ensureSelectedDayExists} around food and neighborhoods`,
                                    `Add a day trip from here`,
                                    `Make Day ${ensureSelectedDayExists} more relaxed`
                                ]
                            }, void 0, false, {
                                fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                lineNumber: 486,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                            lineNumber: 485,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                    lineNumber: 447,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                lineNumber: 445,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: {
                    opacity: 0,
                    x: 20
                },
                animate: {
                    opacity: 1,
                    x: 0
                },
                transition: {
                    type: 'spring',
                    damping: 25,
                    stiffness: 350
                },
                drag: true,
                dragControls: itineraryDragControls,
                dragListener: false,
                dragConstraints: studioRef,
                dragMomentum: false,
                dragElastic: 0.08,
                className: "absolute top-[214px] md:top-44 right-4 bottom-4 w-[calc(100%-2rem)] md:w-[460px] z-20 flex flex-col overflow-hidden rounded-[30px] border border-white/12 bg-[rgba(7,7,12,0.82)] shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    onPointerDown: (event)=>itineraryDragControls.start(event),
                    className: "flex min-h-0 flex-1 flex-col",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute right-4 top-4 z-30 hidden md:inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-[10px] text-white/55 cursor-grab active:cursor-grabbing",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grip$2d$horizontal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__GripHorizontal$3e$__["GripHorizontal"], {
                                    className: "h-3.5 w-3.5"
                                }, void 0, false, {
                                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                                    lineNumber: 523,
                                    columnNumber: 13
                                }, this),
                                "Move"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                            lineNumber: 522,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$trips$2f$ItineraryArtifact$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            tripTitle: trip?.title || 'Trip',
                            days: days,
                            selectedDayIndex: ensureSelectedDayExists,
                            setSelectedDayIndex: setSelectedDayIndex,
                            onSelectItem: onSelectItem,
                            onBulkOps: onBulkOps,
                            onRegenerateDay: handleRegenerateDay,
                            onSwapItem: handleSwapItem,
                            isLoading: isLoading
                        }, void 0, false, {
                            fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                            lineNumber: 526,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                    lineNumber: 518,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                lineNumber: 506,
                columnNumber: 7
            }, this),
            isLoading && !resolvedPayload && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 z-40 bg-black/40 flex items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-sm text-white/50",
                    children: "Loading trip…"
                }, void 0, false, {
                    fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                    lineNumber: 543,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
                lineNumber: 542,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(app)/trips/[tripId]/page.tsx",
        lineNumber: 276,
        columnNumber: 5
    }, this);
}
_s(TripStudioPage, "MP6QP7mudstr1LfzUKv/pXdyTgA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$gestures$2f$drag$2f$use$2d$drag$2d$controls$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDragControls"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$gestures$2f$drag$2f$use$2d$drag$2d$controls$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDragControls"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"],
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useChat$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChat"]
    ];
});
_c = TripStudioPage;
var _c;
__turbopack_context__.k.register(_c, "TripStudioPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_af27e49d._.js.map