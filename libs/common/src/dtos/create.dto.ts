type InputJsonObject = { [key: string]: InputJsonValue };
type InputJsonArray = InputJsonValue[];

// Definindo a classe base para InputJsonValue
export class InputJsonValue {
  // Tipos possíveis de InputJsonValue
  value:
    | string
    | number
    | boolean
    | InputJsonObject
    | InputJsonArray
    | { toJSON(): unknown };

  constructor(
    value:
      | string
      | number
      | boolean
      | InputJsonObject
      | InputJsonArray
      | { toJSON(): unknown },
  ) {
    this.value = value;
  }

  // Método para serializar o valor em JSON, como exigido pelo tipo original
  toJSON(): unknown {
    if (this.value && typeof (this.value as any).toJSON === 'function') {
      // Se o valor tem um método toJSON, chama-o
      return (this.value as { toJSON(): unknown }).toJSON();
    }
    return this.value;
  }
}
