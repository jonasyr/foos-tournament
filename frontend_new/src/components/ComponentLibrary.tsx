import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import { motion } from "motion/react";
import {
  Trophy,
  Zap,
  Medal,
  Flame,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner@2.0.3";

export function ComponentLibrary() {
  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1>Component Library</h1>
            <p className="text-muted-foreground">
              Reusable UI elements and design system showcase
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <Tabs defaultValue="colors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-7">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="icons">Icons</TabsTrigger>
            <TabsTrigger value="misc">Misc</TabsTrigger>
          </TabsList>

          {/* Colors */}
          <TabsContent value="colors" className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4">Color Palette</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="mb-3">Primary Colors</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="w-full h-20 rounded-lg bg-primary"></div>
                      <p className="text-sm">Primary</p>
                      <code className="text-xs text-muted-foreground">#3B82F6</code>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-20 rounded-lg bg-secondary"></div>
                      <p className="text-sm">Secondary</p>
                      <code className="text-xs text-muted-foreground">#10B981</code>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-20 rounded-lg bg-accent"></div>
                      <p className="text-sm">Accent</p>
                      <code className="text-xs text-muted-foreground">#F59E0B</code>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-20 rounded-lg bg-destructive"></div>
                      <p className="text-sm">Destructive</p>
                      <code className="text-xs text-muted-foreground">#EF4444</code>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-3">Neutral Colors</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="w-full h-20 rounded-lg bg-background border border-border"></div>
                      <p className="text-sm">Background</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-20 rounded-lg bg-card border border-border"></div>
                      <p className="text-sm">Card</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-20 rounded-lg bg-muted"></div>
                      <p className="text-sm">Muted</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-20 rounded-lg bg-foreground"></div>
                      <p className="text-sm">Foreground</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-3">Team Colors</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="w-full h-20 rounded-lg" style={{ backgroundColor: "var(--team-yellow)" }}></div>
                      <p className="text-sm">Yellow Team</p>
                      <code className="text-xs text-muted-foreground">#F59E0B</code>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-20 rounded-lg border border-border" style={{ backgroundColor: "var(--team-black)" }}></div>
                      <p className="text-sm">Black Team</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Buttons */}
          <TabsContent value="buttons" className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4">Button Variants</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="mb-3">Primary Buttons</h4>
                  <div className="flex flex-wrap gap-4">
                    <Button>Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-3">Sizes</h4>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon"><Trophy className="w-4 h-4" /></Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-3">With Icons</h4>
                  <div className="flex flex-wrap gap-4">
                    <Button className="gap-2">
                      <Trophy className="w-4 h-4" />
                      Trophy
                    </Button>
                    <Button className="gap-2">
                      <Zap className="w-4 h-4" />
                      Quick Match
                    </Button>
                    <Button
                      className="gap-2 bg-gradient-to-r from-primary to-secondary"
                      onClick={() => toast.success("Button clicked!")}
                    >
                      <CheckCircle className="w-4 h-4" />
                      With Toast
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-3">Rounded</h4>
                  <div className="flex flex-wrap gap-4">
                    <Button className="rounded-full">Pill Button</Button>
                    <Button variant="outline" className="rounded-full">
                      Pill Outline
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Badges */}
          <TabsContent value="badges" className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4">Badge Variants</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="mb-3">Default Badges</h4>
                  <div className="flex flex-wrap gap-4">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-3">With Icons</h4>
                  <div className="flex flex-wrap gap-4">
                    <Badge className="gap-1">
                      <Zap className="w-3 h-3" />
                      Quick Match
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Trophy className="w-3 h-3" />
                      Winner
                    </Badge>
                    <Badge className="gap-1 bg-gradient-to-r from-primary to-secondary">
                      <Medal className="w-3 h-3" />
                      Elite
                    </Badge>
                    <Badge className="gap-1 bg-accent/20 text-accent-foreground">
                      <Flame className="w-3 h-3" />
                      Hot Streak
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Cards */}
          <TabsContent value="cards" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="mb-3">Basic Card</h4>
                <p className="text-sm text-muted-foreground">
                  This is a basic card with padding and border.
                </p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <h4 className="mb-3">Gradient Card</h4>
                <p className="text-sm text-muted-foreground">
                  Card with gradient background.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <h4 className="mb-3">Interactive Card</h4>
                <p className="text-sm text-muted-foreground">
                  Hover over me for shadow effect.
                </p>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm">
                <h4 className="mb-3">Glass Morphism</h4>
                <p className="text-sm text-muted-foreground">
                  Card with glass effect and blur.
                </p>
              </Card>
            </div>
          </TabsContent>

          {/* Forms */}
          <TabsContent value="forms" className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4">Form Elements</h3>

              <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label>Text Input</Label>
                  <Input placeholder="Enter text..." />
                </div>

                <div className="space-y-2">
                  <Label>Slider</Label>
                  <Slider defaultValue={[50]} min={0} max={100} step={1} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <Label>Enable Feature</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle this setting
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-2">
                  <Label>Progress Bar</Label>
                  <Progress value={70} />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Icons */}
          <TabsContent value="icons" className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4">Icon Library</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="mb-3">Sport Icons</h4>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <Trophy className="w-8 h-8 text-primary" />
                      <span className="text-xs">Trophy</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Medal className="w-8 h-8 text-accent" />
                      <span className="text-xs">Medal</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Target className="w-8 h-8 text-secondary" />
                      <span className="text-xs">Target</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Zap className="w-8 h-8 text-accent" />
                      <span className="text-xs">Quick</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-3">Status Icons</h4>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-8 h-8 text-secondary" />
                      <span className="text-xs">Win</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <XCircle className="w-8 h-8 text-destructive" />
                      <span className="text-xs">Loss</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Flame className="w-8 h-8 text-accent animate-pulse" />
                      <span className="text-xs">Streak</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <TrendingUp className="w-8 h-8 text-secondary" />
                      <span className="text-xs">Trending</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Misc */}
          <TabsContent value="misc" className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4">Miscellaneous</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="mb-3">Avatars</h4>
                  <div className="flex flex-wrap gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                        AJ
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-to-br from-secondary to-accent text-white">
                        JL
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-white">
                        SW
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-3">Skeleton Loaders</h4>
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-12 w-1/2" />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-3">Emojis</h4>
                  <div className="flex flex-wrap gap-4 text-4xl">
                    <span>🥇</span>
                    <span>🥈</span>
                    <span>🥉</span>
                    <span>🏓</span>
                    <span>🎯</span>
                    <span>🔥</span>
                    <span>⚡</span>
                    <span>🏆</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
