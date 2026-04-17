import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Box, Terminal, Code2, Layers, Copy, Check, ChevronRight, AlertCircle, CheckCircle2, Shield, Gamepad2, Landmark } from 'lucide-react';

type Section = 'overview' | 'use-cases' | 'installation' | 'initialization' | 'proving' | 'verifying' | 'pricing' | 'examples';

export const SDKDocs: React.FC = () => {
    const [activeSection, setActiveSection] = useState<Section>('overview');
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const sidebarItems: { id: Section; label: string; icon: any }[] = [
        { id: 'overview', label: 'Overview', icon: <BookOpen size={18} /> },
        { id: 'use-cases', label: 'Use Cases', icon: <Layers size={18} /> },
        { id: 'installation', label: 'Installation', icon: <Box size={18} /> },
        { id: 'initialization', label: 'SDK Setup', icon: <Terminal size={18} /> },
        { id: 'proving', label: 'Identity Services', icon: <Code2 size={18} /> },
        { id: 'verifying', label: 'On-Chain Lifecycle', icon: <Layers size={18} /> },
        { id: 'pricing', label: 'Pricing & Tiers', icon: <Landmark size={18} /> },
        { id: 'examples', label: 'API Reference', icon: <Code2 size={18} /> },
    ];

    const CodeBlock = ({ code, label, id }: { code: string; label: string; id: string }) => (
        <div style={{ marginBottom: '2rem', position: 'relative' }}>
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '0.5rem 1rem',
                borderTopLeftRadius: '0.5rem',
                borderTopRightRadius: '0.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{label}</span>
                <button
                    onClick={() => copyToClipboard(code, id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                    {copied === id ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                </button>
            </div>
            <pre style={{
                margin: 0,
                padding: '1.5rem',
                background: 'rgba(0,0,0,0.3)',
                borderBottomLeftRadius: '0.5rem',
                borderBottomRightRadius: '0.5rem',
                overflowX: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                color: '#f8f8f2'
            }}>
                <code>{code}</code>
            </pre>
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'overview':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Noah SDK Overview</h1>
                        <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
                            The Noah SDK is the gateway to privacy-preserving identity on **Ethereum Sepolia**. Built on the **Fhenix Coprocessor**, it enables users to bind their identity attributes to their wallet using client-side Fully Homomorphic Encryption (CoFHE).
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Verify Once, Use Everywhere</h4>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Users register their identity once on Sepolia. integrated apps can verify attributes instantly without redundant KYC.</p>
                            </div>
                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Fhenix Coprocessor (CoFHE)</h4>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Perform private computation (like age &gt; 18) directly on encrypted data without revealing the raw values to the network.</p>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Integration Lifecycle</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { step: "1", title: "Initialize SDK", desc: "Connect the Noah SDK to your Sepolia RPC and protocol contracts." },
                                { step: "2", title: "Automated OCR", desc: "Scan physical documents locally using the high-performance MRZ extractor." },
                                { step: "3", title: "Client-Side Encryption", desc: "Encrypt identity attributes (like age) for the Fhenix Coprocessor using CoFHE." },
                                { step: "4", title: "Identity Binding", desc: "Submit the encrypted identity to the Sepolia registry via a trusted Issuer." },
                                { step: "5", title: "Private Verification", desc: "Verify user eligibility using FHE permits and unsealing—zero data exposure." }
                            ].map((s) => (
                                <div key={s.step} style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                                    <div style={{ background: 'var(--primary)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                                        {s.step}
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{s.title}</h4>
                                        <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            case 'use-cases':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Use Cases</h1>
                        <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                            The Noah SDK enables a wide range of privacy-first applications. By leveraging the Fhenix Coprocessor, protocols can enforce complex rules on encrypted user data without ever revealing the underlying identity.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                            {[
                                {
                                    icon: <Gamepad2 size={24} />,
                                    title: "Fair Gaming & E-Sports",
                                    desc: "Verify that each player is a unique human. Prevent multi-accounting and bots on Sepolia-based games without storing personal player data."
                                },
                                {
                                    icon: <Shield size={24} />,
                                    title: "Compliant Consumer Apps",
                                    desc: "Age-gate content or services effortlessly. Private attributes are checked via CoFHE, ensuring you never sit on a liability of user ID data."
                                },
                                {
                                    icon: <Landmark size={24} />,
                                    title: "DeFi & RWA Onboarding",
                                    desc: "Onboard users to sensitive protocols. Meet strict compliance requirements while maintaining top-tier on-chain privacy for your liquidity providers."
                                }
                            ].map((uc, i) => (
                                <div key={i} className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ color: 'var(--primary)', background: 'rgba(var(--primary-rgb), 0.05)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {uc.icon}
                                    </div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{uc.title}</h4>
                                    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', lineHeight: 1.5 }}>{uc.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            case 'installation':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Installation</h1>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>The Noah Protocol SDK is published as `noah-protocol`. It provides all tools necessary for CoFHE encryption, MRZ extraction, and Sepolia smart contract interaction.</p>

                        <div style={{ marginBottom: '2.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Production Install</h3>
                            <CodeBlock code="npm install noah-protocol" label="Terminal" id="install-prod" />
                        </div>

                        <div className="glass" style={{ padding: '1.5rem', marginTop: '2rem' }}>
                            <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Layers size={18} className="text-primary" /> Peer Dependencies
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                                Noah requires `ethers` (v6) for blockchain connectivity and `@fhenixprotocol/js-sdk` for CoFHE operations.
                            </p>
                            <CodeBlock code='{\n  "dependencies": {\n    "noah-protocol": "^2.0.0",\n    "ethers": "^6.10.0",\n    "@fhenixprotocol/js-sdk": "^0.2.1"\n  }\n}' label="package.json" id="package-deps-v2" />
                        </div>

                        <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.5rem', borderRadius: '1rem', marginTop: '2.5rem' }}>
                            <h4 style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <AlertCircle size={18} /> Performance Notice
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                CoFHE encryption uses WASM-based cryptographic primitives. For optimal performance, ensure your environment supports `Wasm` and has &gt;2GB of available memory during encryption cycles.
                            </p>
                        </div>
                    </motion.div>
                );
            case 'initialization':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>SDK Setup</h1>
                        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            The Noah SDK should be initialized with your Sepolia RPC and the protocol's contract addresses. In the frontend, always use a public configuration.
                        </p>

                        <div style={{ marginBottom: '3rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Client Configuration</h3>
                            <CodeBlock
                                label="src/hooks/useNoah.ts"
                                id="init-code-v2"
                                code={`import { NoahSDK } from 'noah-protocol';\nimport { ethers } from 'ethers';\n\n// 1. Setup Sepolia Provider\nconst provider = new ethers.BrowserProvider(window.ethereum);\n\n// 2. Initialize with public parameters\nconst sdk = new NoahSDK({\n  rpcUrl: import.meta.env.VITE_SEPOLIA_RPC, \n  contractAddresses: {\n    CredentialRegistry: import.meta.env.VITE_REGISTRY_ADDR,\n    ProtocolAccessControl: import.meta.env.VITE_ACCESS_ADDR\n  }\n});\n\n// 3. Connect to wallet\nsdk.init(provider);`}
                            />
                        </div>

                        <div className="glass" style={{ padding: '1.5rem', border: '1px solid var(--primary-subtle)', background: 'rgba(var(--primary-rgb), 0.02)' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Shield size={18} /> Secure Issuer Setup (Backend Only)
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                To authorize registration transactions, the **Issuer Private Key** must be configured in a secure Node.js environment. Never expose this key in your frontend build.
                            </p>
                            <CodeBlock
                                label=".env (Backend)"
                                id="init-backend-v2"
                                code={`# In your secure server-side environment\nNOAH_ISSUER_PRIVATE_KEY=0x...your_secure_issuer_key\n`}
                            />
                        </div>

                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1.5rem', borderRadius: '1rem', marginTop: '2.5rem' }}>
                            <h4 style={{ color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Terminal size={18} /> Pro Tip: Provider Refresh
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                If users switch networks in their wallet, remember to re-run `sdk.init(newProvider)` to ensure the SDK remains synchronized with the active Sepolia connection.
                            </p>
                        </div>
                    </motion.div>
                );
            case 'proving':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Identity Services</h1>
                        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            Noah provides two core identity services: client-side OCR extraction and CoFHE identity encryption. These services ensure that raw identity data never leaves the user's device in plaintext.
                        </p>

                        <div style={{ marginBottom: '3rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>1. Local MRZ Extraction</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                The `extractPassportData` method scans passport photos locally. It extracts the MRZ (Machine Readable Zone) and parses it into structured data artifacts.
                            </p>
                            <CodeBlock
                                label="Handle File Upload"
                                id="ocr-code-v2"
                                code={`// This happens entirely in the browser\nconst imageFile = e.target.files[0];\nconst mrzData = await sdk.extractPassportData(imageFile);\n\nconsole.log(mrzData.firstName); // "JONATHAN"\nconsole.log(mrzData.age); // 28`}
                            />
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>2. CoFHE Identity Encryption</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                Encrypt identity attributes for the Fhenix Coprocessor. This allows smart contracts to perform private logic on the data without ever seeing the raw values.
                            </p>
                            <CodeBlock
                                label="Encrypt Age for CoFHE"
                                id="proof-code-v2"
                                code={`// 1. Prepare credential\nconst credential = { \n  age: mrzData.age \n};\n\n// 2. Encrypt using UserClient\nconst encryptedIdentity = await sdk.user.encryptIdentity(credential);\n\n// Use result for on-chain registration\nconsole.log("Encrypted Blob:", encryptedIdentity.data);`}
                            />
                        </div>

                        <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.5rem', borderRadius: '1rem', marginTop: '2.5rem' }}>
                            <h4 style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <CheckCircle2 size={18} /> Privacy First
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                Raw MRZ data is destroyed immediately after encryption. Only the encrypted `inEuint32` struct is submitted to the Sepolia network.
                            </p>
                        </div>
                    </motion.div>
                );
            case 'verifying':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>On-Chain Lifecycle</h1>
                        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            Interact with Noah smart contracts on Sepolia to register identities and verify requirements privately using the Fhenix Coprocessor.
                        </p>

                        <div style={{ marginBottom: '3rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>1. Identity Registration</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                Register the encrypted identity on-chain. This binds the identity to the user's wallet address using a deterministic nullifier.
                            </p>
                            <CodeBlock
                                label="Register on Sepolia"
                                id="check-code-v2"
                                code={`const userAddress = await signer.getAddress();\n\n// Returns a transaction result once confirmed\nconst tx = await sdk.user.registerIdentity(userAddress, encryptedIdentity);\n\nconsole.log("Identity Registered!", tx.transactionHash);`}
                            />
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>2. Private Requirement Verification</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                Protocols can verify if a user meets a requirement (e.g., age &gt; 18) without ever seeing the raw data. This uses FHE permits and unsealing.
                            </p>
                            <CodeBlock
                                label="Verify Eligibility"
                                id="submit-code-v2"
                                code={`try {\n  // 1. Specify the protocol contract to verify against\n  const protocolAddress = "0x..."; \n  \n  // 2. Perform FHE verification (Permit + Unseal)\n  const isEligible = await sdk.user.verifyRequirement(protocolAddress);\n  \n  if (isEligible) {\n    console.log("Access Granted!");\n  }\n} catch (e) {\n  console.error("Verification failed", e);\n}`}
                            />
                        </div>
                    </motion.div>
                );
            case 'pricing':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Pricing & Monetization</h1>
                        <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                            The Noah Protocol is designed to be self-sustaining. Verification costs are calculated per attribute check, with flexible tiers for growing applications.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                            {[
                                {
                                    title: "Free Tier",
                                    price: "$0",
                                    desc: "10 verifications / mo",
                                    features: ["Basic MRZ Extraction", "Age Verification", "Discord Support"]
                                },
                                {
                                    title: "Pro Tier",
                                    price: "$99/mo",
                                    desc: "Unlimited verifications",
                                    features: ["Priority CoFHE", "Bulk Proving", "Shared Infrastructure", "Custom Rules"]
                                },
                                {
                                    title: "Enterprise",
                                    price: "Custom",
                                    desc: "Volume-based scaling",
                                    features: ["Dedicated Coprocessor", "Private RPC", "SLA Support", "Advanced Analytics"]
                                }
                            ].map((tier, i) => (
                                <div key={i} className="glass" style={{ 
                                    padding: '2rem', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '1rem',
                                    border: tier.title === 'Pro Tier' ? '1px solid var(--primary)' : '1px solid var(--border)',
                                    background: tier.title === 'Pro Tier' ? 'rgba(var(--primary-rgb), 0.05)' : 'rgba(255,255,255,0.02)'
                                }}>
                                    <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{tier.title}</h4>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{tier.price}</span>
                                    </div>
                                    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{tier.desc}</p>
                                    <div style={{ margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {tier.features.map((f, fi) => (
                                            <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                <CheckCircle2 size={12} className="text-primary" /> {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="glass" style={{ padding: '2rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Layers size={18} className="text-primary" /> Usage-Based Billing
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                For high-volume applications, Noah offers a flat rate of **$0.99 per verification**. Integrated via Razorpay for seamless institutional onboarding.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-primary">Upgrade to Pro</button>
                                <button className="btn btn-outline">Contact Sales</button>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'examples':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>API Reference</h1>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Comprehensive breakdown of the modern Noah SDK interface.</p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Method</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Namespace</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Context / Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { name: "extractPassportData(file)", space: "SDK", context: "Scans MRZ lines from a passport image and returns parsed data." },
                                    { name: "init(provider)", space: "SDK", context: "Connects the SDK to an ethers-compatible Sepolia provider." },
                                    { name: "user.encryptIdentity(cred)", space: "User", context: "Client-side CoFHE encryption of identity attributes (age)." },
                                    { name: "user.registerIdentity(addr, data)", space: "User", context: "Binds encrypted identity to a wallet on Sepolia registry." },
                                    { name: "user.verifyRequirement(protocol)", space: "User", context: "Performs FHE verification (Permit + Unseal) for a protocol." },
                                    { name: "user.isRegistered(addr?)", space: "User", context: "Checks registration status on the Sepolia FHENoahRegistry." },
                                    { name: "contracts.getRequirements(protocol)", space: "Contracts", context: "Fetches minAge and status for a specific protocol." },
                                    { name: "contracts.setRequirements(signer, age)", space: "Contracts", context: "Set protocol access rules (Protocol owners only)." }
                                ].map((m, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontSize: '0.85rem' }}>{m.name}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>{m.space}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>{m.context}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-dark)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                            <h4 style={{ marginBottom: '1rem' }}>Looking for full examples?</h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                Check out the updated boilerplate project on GitHub for end-to-end integration examples on Sepolia.
                            </p>
                            <button className="btn btn-primary">Join Discord Support</button>
                        </div>
                    </motion.div>
                );
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 140px)', position: 'relative' }}>
            {/* Sidebar */}
            <aside style={{
                width: '280px',
                borderRight: '1px solid var(--border)',
                padding: '2rem',
                flexShrink: 0
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>Documentation</span>
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                background: activeSection === item.id ? 'var(--primary-subtle)' : 'transparent',
                                color: activeSection === item.id ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontWeight: activeSection === item.id ? 600 : 500,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {item.icon}
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {activeSection === item.id && <ChevronRight size={16} />}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '4rem 6rem', maxWidth: '1000px' }}>
                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>
            </main>
        </div>
    );
};
